import React, { useEffect, useRef, useState } from 'react';
import { CivicReport, LocationData } from '../types';

declare const L: any;

interface MapViewProps {
    reports: CivicReport[];
    userLocation: LocationData | null;
    onBack: () => void;
    onReportClick?: (report: CivicReport) => void;
}

export const MapView: React.FC<MapViewProps> = ({ reports, userLocation, onBack, onReportClick }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [selectedReport, setSelectedReport] = useState<CivicReport | null>(null);

    const UDAIPUR_CENTER = { lat: 24.5854, lng: 73.7125 };

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = L.map(mapRef.current, {
            zoomControl: false
        }).setView(
            [userLocation?.latitude || UDAIPUR_CENTER.lat, userLocation?.longitude || UDAIPUR_CENTER.lng],
            13
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Add zoom control to bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstance.current = map;

        if (userLocation) {
            const userIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="w-4 h-4 bg-primary-600 rounded-full border-3 border-white shadow-lg pulse-ring"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });
            L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
                .addTo(map)
                .bindPopup('<div class="font-semibold text-sm">📍 Your Location</div>');
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [userLocation]);

    // Update markers when reports/filter changes
    useEffect(() => {
        if (!mapInstance.current) return;

        // Clear existing markers
        mapInstance.current.eachLayer((layer: any) => {
            if (layer instanceof L.CircleMarker && !layer._isUserLocation) {
                mapInstance.current.removeLayer(layer);
            }
        });

        const filteredReports = filter === 'ALL' ? reports : reports.filter(r => r.status === filter);

        filteredReports.forEach(report => {
            if (!report.location) return;

            const urgencyColors: Record<string, { fill: string; border: string }> = {
                'Critical': { fill: '#DC2626', border: '#FEE2E2' },
                'High': { fill: '#F59E0B', border: '#FEF3C7' },
                'Medium': { fill: '#EAB308', border: '#FEF9C3' },
                'Low': { fill: '#16A34A', border: '#DCFCE7' }
            };

            const colors = urgencyColors[report.analysis?.urgency || 'Medium'] || urgencyColors['Medium'];

            const marker = L.circleMarker([report.location.latitude, report.location.longitude], {
                radius: report.analysis?.urgency === 'Critical' ? 10 : 8,
                fillColor: colors.fill,
                color: '#FFFFFF',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(mapInstance.current);

            marker.on('click', () => {
                setSelectedReport(report);
                if (onReportClick) onReportClick(report);
            });
        });
    }, [reports, filter, onReportClick]);

    const getFilterCount = (status: string) => {
        if (status === 'ALL') return reports.length;
        return reports.filter(r => r.status === status).length;
    };

    const getUrgencyColor = (urgency?: string) => {
        switch (urgency) {
            case 'Critical': return 'bg-red-500';
            case 'High': return 'bg-orange-500';
            case 'Medium': return 'bg-yellow-500';
            default: return 'bg-green-500';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <header className="glass-strong px-5 py-4 z-30 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="font-bold text-lg text-gray-900 dark:text-white">City Issues Map</h1>
                        <p className="text-xs text-gray-500">{reports.length} reports across Udaipur</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${showHeatmap
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                >
                    🔥 Heatmap
                </button>
            </header>

            {/* Filter Chips */}
            <div className="glass-strong px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-slate-800 z-20">
                {(['ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${filter === status
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400'
                            }`}
                    >
                        {status === 'ALL' ? 'All' : status.replace('_', ' ')} ({getFilterCount(status)})
                    </button>
                ))}
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                <div ref={mapRef} className="absolute inset-0 z-10" />

                {/* Legend */}
                <div className="absolute bottom-24 left-4 card-premium p-4 z-20">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Urgency Level</div>
                    <div className="space-y-2">
                        {[
                            { label: 'Critical', color: 'bg-red-500' },
                            { label: 'High', color: 'bg-orange-500' },
                            { label: 'Medium', color: 'bg-yellow-500' },
                            { label: 'Low', color: 'bg-green-500' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Location Button */}
                {userLocation && (
                    <button
                        onClick={() => mapInstance.current?.setView([userLocation.latitude, userLocation.longitude], 15)}
                        className="absolute bottom-24 right-4 card-premium w-12 h-12 rounded-full flex items-center justify-center z-20 hover:shadow-lg transition-shadow"
                    >
                        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                )}

                {/* Selected Report Bottom Sheet */}
                {selectedReport && (
                    <div className="absolute bottom-0 left-0 right-0 z-30 animate-slide-up">
                        <div className="card-premium mx-4 mb-4 p-4 rounded-2xl">
                            <div className="flex gap-4">
                                {/* Image */}
                                {selectedReport.images && selectedReport.images.length > 0 ? (
                                    <img src={selectedReport.images[0]} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0">🏙️</div>
                                )}

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                            {selectedReport.analysis?.category || 'Issue'}
                                        </h4>
                                        <button
                                            onClick={() => setSelectedReport(null)}
                                            className="p-1 -mr-1 text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mb-2">{selectedReport.address}</p>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`chip ${selectedReport.status === 'RESOLVED' ? 'chip-success' :
                                                selectedReport.status === 'IN_PROGRESS' ? 'chip-warning' : 'chip-primary'
                                            }`}>
                                            {selectedReport.status.replace('_', ' ')}
                                        </span>
                                        <span className={`chip ${selectedReport.analysis?.urgency === 'Critical' ? 'chip-critical' :
                                                selectedReport.analysis?.urgency === 'High' ? 'chip-warning' : 'chip-success'
                                            }`}>
                                            {selectedReport.analysis?.urgency || 'Low'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                        <span>👍 {selectedReport.upvotes} upvotes</span>
                                        <span>💬 {selectedReport.comments?.length || 0} comments</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
