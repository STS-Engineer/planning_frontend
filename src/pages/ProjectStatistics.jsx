import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, Scatter
} from 'recharts';
import ApiService from '../services/api';
import { useAuth } from '../components/context/AuthContext';


const ProjectStatistics = ({ selectedProject, projects = [] }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [allProjectsStats, setAllProjectsStats] = useState(null);
    const [projectsKPI, setProjectsKPI] = useState([]);
    const [filteredProjectsKPI, setFilteredProjectsKPI] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState('all'); // 'all' or member ID
    const [memberStats, setMemberStats] = useState(null);
    const [showMemberStats, setShowMemberStats] = useState(false);
    const [stats, setStats] = useState({
        totalTasks: 0,
        todoTasks: 0,
        inProgressTasks: 0,
        doneTasks: 0,
        completionRate: 0,
        avgTasksPerDay: 0,
        projectDuration: 0,
        daysRemaining: 0,
        daysElapsed: 0,
        progressPercentage: 0,
        tasksDistribution: [],
        assignmentDistribution: [],
        dailyTasks: [],
        memberContributions: [],
        totalMembers: 0,
        assignedTasks: 0,
        unassignedTasks: 0
    });
    const [allMembers, setAllMembers] = useState([]);
    const [error, setError] = useState(null);
    // Add these state variables with your other state declarations:
    const [timelineData, setTimelineData] = useState([]);
    const [timelineInsights, setTimelineInsights] = useState(null);
    const [showTimelineChart, setShowTimelineChart] = useState(true);
    const [timelineLoading, setTimelineLoading] = useState(false);




    // TimelineChart Component
    // Replace the TimelineChart component with this updated version
    const TimelineChart = ({ memberId = null }) => {
        const isSingleProject = selectedProject?.project_id;
        const isMemberView = memberId && memberId !== 'all';

        if (timelineLoading) {
            return (
                <div style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    marginTop: '25px'
                }}>
                    <div style={{
                        fontSize: '48px',
                        animation: 'spin 1.5s linear infinite',
                        marginBottom: '20px'
                    }}>
                        ⏳
                    </div>
                    <p style={{ fontSize: '16px', color: '#666' }}>
                        {isMemberView ? 'Loading member timeline...' : 'Loading timeline data...'}
                    </p>
                    <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                </div>
            );
        }

        if (!timelineData || timelineData.length === 0) {
            return (
                <EmptyChart
                    message={isMemberView ? "No timeline data for this member" : "No timeline data available"}
                    icon="📅"
                />
            );
        }

        return (
            <div style={{
                gridColumn: '1 / -1',
                background: 'white',
                padding: '25px',
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                marginTop: '25px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '25px',
                    flexWrap: 'wrap',
                    gap: '15px'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '24px',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>📅</span>
                        {isMemberView ? 'Member Progress Timeline' :
                            isSingleProject ? 'Project Evolution Timeline' : 'Projects Progress Timeline'}
                        <span style={{
                            fontSize: '14px',
                            fontWeight: 'normal',
                            color: '#667eea',
                            background: '#f0f4ff',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            marginLeft: '10px'
                        }}>
                            {timelineData.length} days
                            {isMemberView && ' • Member View'}
                        </span>
                    </h2>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <button
                            onClick={() => setShowTimelineChart(!showTimelineChart)}
                            style={{
                                padding: '8px 16px',
                                background: showTimelineChart ? '#667eea' : '#f0f0f0',
                                color: showTimelineChart ? 'white' : '#666',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {showTimelineChart ? 'Hide Timeline' : 'Show Timeline'}
                        </button>
                    </div>
                </div>

                {showTimelineChart && (
                    <>
                        <div style={{
                            width: '100%',
                            height: '400px',
                            marginBottom: '20px'
                        }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={timelineData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        tick={{ fontSize: 11 }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        domain={[0, 100]}
                                        label={{
                                            value: isMemberView ? 'Member Progress (%)' :
                                                isSingleProject ? 'Progress (%)' : 'Progress & Productivity (%)',
                                            angle: -90,
                                            position: 'insideLeft',
                                            offset: -10,
                                            style: { fontSize: 12 }
                                        }}
                                        tickFormatter={(value) => `${value}%`}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        label={{
                                            value: 'Tasks Count',
                                            angle: 90,
                                            position: 'insideRight',
                                            offset: -10,
                                            style: { fontSize: 12 }
                                        }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            border: 'none',
                                            padding: '15px',
                                            background: 'white'
                                        }}
                                        formatter={(value, name) => {
                                            const formattedName = {
                                                'progress': isMemberView ? 'Member Progress' : 'Progress',
                                                'memberProgress': 'Member Progress',
                                                'totalProgress': 'Overall Progress',
                                                'tasksCompleted': 'Tasks Completed',
                                                'completedTasks': 'Total Tasks Completed',
                                                'tasksCreated': 'Tasks Created',
                                                'newTasks': 'New Tasks',
                                                'dailyNewTasks': 'New Tasks (Daily)',
                                                'dailyCompletedTasks': 'Completed Tasks (Daily)',
                                                'activeMembers': 'Active Members',
                                                'activeProjects': 'Active Projects',
                                                'productivity': isMemberView ? 'Member Productivity' : 'Team Productivity',
                                                'todoTasks': 'To Do Tasks',
                                                'inProgressTasks': 'In Progress Tasks',
                                                'memberTasksCompleted': 'Member Tasks Completed',
                                                'memberProductivity': 'Member Productivity',
                                                'assignedTasks': 'Assigned Tasks'
                                            }[name] || name;

                                            const formattedValue = name.includes('Progress') || name.includes('productivity') || name.includes('Productivity')
                                                ? `${value}%`
                                                : value;

                                            return [formattedValue, formattedName];
                                        }}
                                        labelFormatter={(label) => `Date: ${label}`}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        height={36}
                                    />

                                    {isMemberView ? (
                                        // Member-specific timeline
                                        <>
                                            <Area
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="memberProgress"
                                                name="Member Progress"
                                                stroke="#9d4edd"
                                                fill="url(#colorMemberProgress)"
                                                strokeWidth={3}
                                                dot={{ r: 3, strokeWidth: 2, fill: '#9d4edd' }}
                                                activeDot={{ r: 6, strokeWidth: 2, fill: '#9d4edd' }}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="memberTasksCompleted"
                                                name="Tasks Completed (Member)"
                                                stroke="#4ecdc4"
                                                strokeWidth={2}
                                                dot={{ r: 2 }}
                                            />
                                            <Bar
                                                yAxisId="right"
                                                dataKey="dailyCompletedTasks"
                                                name="Daily Completed (Member)"
                                                fill="#a8e6cf"
                                                radius={[2, 2, 0, 0]}
                                                opacity={0.7}
                                            />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="memberProductivity"
                                                name="Member Productivity"
                                                stroke="#ff6b6b"
                                                strokeWidth={2}
                                                strokeDasharray="3 3"
                                                dot={{ r: 2 }}
                                            />
                                        </>
                                    ) : isSingleProject ? (
                                        // Single project timeline
                                        <>
                                            <Area
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="progress"
                                                name="Progress"
                                                stroke="#667eea"
                                                fill="url(#colorProgress)"
                                                strokeWidth={3}
                                                dot={{ r: 3, strokeWidth: 2, fill: '#667eea' }}
                                                activeDot={{ r: 6, strokeWidth: 2, fill: '#667eea' }}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="tasksCompleted"
                                                name="Cumulative Completed"
                                                stroke="#4ecdc4"
                                                strokeWidth={2}
                                                dot={{ r: 2 }}
                                            />
                                            <Bar
                                                yAxisId="right"
                                                dataKey="dailyCompletedTasks"
                                                name="Daily Completed"
                                                fill="#a8e6cf"
                                                radius={[2, 2, 0, 0]}
                                                opacity={0.7}
                                            />
                                            <Scatter
                                                yAxisId="right"
                                                dataKey="activeMembers"
                                                name="Active Members"
                                                fill="#ff6b6b"
                                                shape="circle"
                                            />
                                        </>
                                    ) : (
                                        // Multiple projects timeline
                                        <>
                                            <Area
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="totalProgress"
                                                name="Overall Progress"
                                                stroke="#667eea"
                                                fill="url(#colorProgress)"
                                                strokeWidth={3}
                                                dot={{ r: 3, strokeWidth: 2, fill: '#667eea' }}
                                                activeDot={{ r: 6, strokeWidth: 2, fill: '#667eea' }}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="completedTasks"
                                                name="Cumulative Completed"
                                                stroke="#4ecdc4"
                                                strokeWidth={2}
                                                dot={{ r: 2 }}
                                            />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="productivity"
                                                name="Team Productivity"
                                                stroke="#9d4edd"
                                                strokeWidth={2}
                                                strokeDasharray="3 3"
                                                dot={{ r: 2 }}
                                            />
                                            <Bar
                                                yAxisId="right"
                                                dataKey="dailyNewTasks"
                                                name="New Tasks (Daily)"
                                                fill="#ffd93d"
                                                radius={[2, 2, 0, 0]}
                                                opacity={0.6}
                                            />
                                        </>
                                    )}

                                    <defs>
                                        <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                                        </linearGradient>
                                        <linearGradient id="colorMemberProgress" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9d4edd" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#9d4edd" stopOpacity={0.1} />
                                        </linearGradient>
                                        <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9d4edd" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#9d4edd" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Timeline Insights */}
                        {timelineInsights && (
                            <div style={{
                                marginTop: '30px',
                                padding: '25px',
                                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                borderRadius: '16px',
                                border: '1px solid #dee2e6'
                            }}>
                                <h3 style={{
                                    margin: '0 0 20px 0',
                                    fontSize: '18px',
                                    color: '#2c3e50',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <span>💡</span>
                                    Timeline Insights
                                </h3>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '15px'
                                }}>
                                    {isMemberView ? (
                                        <>
                                            <TimelineInsightCard
                                                icon="📈"
                                                title="Member Progress"
                                                value={`${timelineInsights.memberProgress || timelineInsights.currentProgress || 0}%`}
                                                change="Personal completion rate"
                                                color="#9d4edd"
                                            />
                                            <TimelineInsightCard
                                                icon="⚡"
                                                title="Avg Daily Progress"
                                                value={`${timelineInsights.averageDailyProgress || calculateAverageDailyProgress()}%`}
                                                change="per day"
                                                color="#4ecdc4"
                                            />
                                            <TimelineInsightCard
                                                icon="🎯"
                                                title="Most Productive Day"
                                                value={timelineInsights.mostProductiveDay?.date || findMostProductiveDay()}
                                                change={`Completed ${timelineInsights.mostProductiveDay?.tasks || 0} tasks`}
                                                color="#ffd93d"
                                            />
                                            <TimelineInsightCard
                                                icon="📊"
                                                title="Productivity"
                                                value={`${timelineInsights.memberProductivity || calculateMemberProductivity()}%`}
                                                change="Member efficiency score"
                                                color="#ff6b6b"
                                            />
                                            <TimelineInsightCard
                                                icon="📅"
                                                title="Active Days"
                                                value={timelineInsights.activeDays || calculateActiveDays()}
                                                change="Days with contributions"
                                                color="#667eea"
                                            />
                                            <TimelineInsightCard
                                                icon="📈"
                                                title="Progress Trend"
                                                value={(timelineInsights.progressTrend || calculateMemberProgressTrend()) > 0 ? "📈 Rising" : "📉 Declining"}
                                                change={`${Math.abs(timelineInsights.progressTrend || calculateMemberProgressTrend())}% weekly`}
                                                color="#36ba9b"
                                            />
                                        </>
                                    ) : isSingleProject ? (
                                        <>
                                            <TimelineInsightCard
                                                icon="📈"
                                                title="Current Progress"
                                                value={`${timelineInsights.currentProgress || 0}%`}
                                                change="Project completion"
                                                color="#667eea"
                                            />
                                            <TimelineInsightCard
                                                icon="⚡"
                                                title="Avg Daily Progress"
                                                value={`${timelineInsights.averageDailyProgress || calculateAverageDailyProgress()}%`}
                                                change="per day"
                                                color="#4ecdc4"
                                            />
                                            <TimelineInsightCard
                                                icon="🎯"
                                                title="Peak Productivity"
                                                value={timelineInsights.peakProgressDay?.date || findPeakProgressDay()}
                                                change={`+${timelineInsights.peakProgressDay?.progressIncrease || 0}% increase`}
                                                color="#ffd93d"
                                            />
                                            <TimelineInsightCard
                                                icon="📊"
                                                title="Consistency"
                                                value={`${timelineInsights.consistencyScore || calculateTimelineCoverage()}%`}
                                                change="Progress stability"
                                                color="#ff6b6b"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <TimelineInsightCard
                                                icon="📈"
                                                title="Overall Progress"
                                                value={`${timelineInsights.overallProgress || 0}%`}
                                                change="All projects"
                                                color="#667eea"
                                            />
                                            <TimelineInsightCard
                                                icon="📊"
                                                title="Avg Productivity"
                                                value={`${timelineInsights.averageDailyProductivity || calculateAverageProductivity()}%`}
                                                change="across all projects"
                                                color="#4ecdc4"
                                            />
                                            <TimelineInsightCard
                                                icon="🚀"
                                                title="Most Productive Day"
                                                value={timelineInsights.mostProductiveDay?.date || findMostProductiveDay()}
                                                change={`${timelineInsights.mostProductiveDay?.productivity || 0}% productivity`}
                                                color="#ffd93d"
                                            />
                                            <TimelineInsightCard
                                                icon="👥"
                                                title="Avg Active Projects"
                                                value={timelineInsights.averageActiveProjects || 0}
                                                change="daily average"
                                                color="#9d4edd"
                                            />
                                            <TimelineInsightCard
                                                icon="📈"
                                                title="Progress Trend"
                                                value={(timelineInsights.progressTrend || calculateProgressTrend()) > 0 ? "📈 Rising" : "📉 Declining"}
                                                change={`${Math.abs(timelineInsights.progressTrend || calculateProgressTrend())}% weekly`}
                                                color="#36ba9b"
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Timeline Legend */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: '20px',
                            fontSize: '12px',
                            color: '#666',
                            gap: '20px',
                            flexWrap: 'wrap'
                        }}>
                            {isMemberView ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '12px', height: '12px', background: '#9d4edd', borderRadius: '2px' }}></div>
                                        <span>Member Progress</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '12px', height: '2px', background: '#4ecdc4' }}></div>
                                        <span>Tasks Completed</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '12px', height: '12px', background: '#a8e6cf', borderRadius: '2px' }}></div>
                                        <span>Daily Completed</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '2px', height: '12px', background: '#ff6b6b' }}></div>
                                        <span>Member Productivity</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '12px', height: '12px', background: '#667eea', borderRadius: '2px' }}></div>
                                        <span>{isSingleProject ? 'Project Progress' : 'Overall Progress'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '12px', height: '2px', background: '#4ecdc4' }}></div>
                                        <span>Cumulative Completed Tasks</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '12px', height: '12px', background: '#ffd93d', borderRadius: '2px' }}></div>
                                        <span>Daily New Tasks</span>
                                    </div>
                                    {!isSingleProject && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <div style={{ width: '2px', height: '12px', background: '#9d4edd' }}></div>
                                            <span>Team Productivity</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    };
    // TimelineInsightCard Component
    const TimelineInsightCard = ({ icon, title, value, change, color }) => (
        <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '12px',
            borderLeft: `4px solid ${color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease',
            height: '100%'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px'
            }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: color
                }}>
                    {icon}
                </div>
                <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2c3e50'
                }}>
                    {title}
                </div>
            </div>
            <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#2c3e50',
                marginBottom: '5px',
                lineHeight: '1.2'
            }}>
                {value}
            </div>
            <div style={{
                fontSize: '12px',
                color: '#666',
                lineHeight: '1.4'
            }}>
                {change}
            </div>
        </div>
    );

// Add these new functions with your other helper functions

    const calculateMemberProductivity = () => {
        if (timelineData.length === 0) return 0;
        const sum = timelineData.reduce((acc, day) => acc + (day.memberProductivity || 0), 0);
        return (sum / timelineData.length).toFixed(1);
    };

    const calculateMemberProgressTrend = () => {
        if (timelineData.length < 7) return 0;

        const lastWeek = timelineData.slice(-7);
        const firstProgress = lastWeek[0].memberProgress || 0;
        const lastProgress = lastWeek[lastWeek.length - 1].memberProgress || 0;

        return parseFloat(((lastProgress - firstProgress) / Math.max(1, firstProgress) * 100).toFixed(1));
    };

    const calculateActiveDays = () => {
        if (timelineData.length === 0) return 0;
        const daysWithActivity = timelineData.filter(day =>
            (day.memberTasksCompleted && day.memberTasksCompleted > 0) ||
            (day.dailyCompletedTasks && day.dailyCompletedTasks > 0)
        ).length;
        return daysWithActivity;
    };

    const calculateAvgTasksPerDay = (totalTasks, daysElapsed) => {
        if (!daysElapsed || daysElapsed === 0) return 0;
        return Number((totalTasks / daysElapsed).toFixed(1));
    };


    // Timeline-specific helper functions
    const calculateAverageDailyProgress = () => {
        if (timelineData.length < 2) return 0;
        const progressValues = timelineData.map(d => d.progress);
        const differences = [];

        for (let i = 1; i < progressValues.length; i++) {
            differences.push(progressValues[i] - progressValues[i - 1]);
        }

        const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
        return parseFloat(avgDifference.toFixed(1));
    };

    const findPeakProgressDay = () => {
        if (timelineData.length === 0) return 'N/A';

        let maxProgress = 0;
        let peakDay = '';

        timelineData.forEach(day => {
            if (day.progress > maxProgress) {
                maxProgress = day.progress;
                peakDay = day.date;
            }
        });

        return peakDay;
    };

    const calculateTimelineCoverage = () => {
        const projectDuration = selectedProject?.projectDuration || 90;
        const dataDays = timelineData.length;
        return Math.min(Math.round((dataDays / projectDuration) * 100), 100);
    };

    const calculateAverageProductivity = () => {
        if (timelineData.length === 0) return 0;
        const sum = timelineData.reduce((acc, day) => acc + (day.productivity || 0), 0);
        return (sum / timelineData.length).toFixed(1);
    };

    const findMostProductiveDay = () => {
        if (timelineData.length === 0) return 'N/A';

        let maxProductivity = 0;
        let productiveDay = '';

        timelineData.forEach(day => {
            const productivity = day.productivity || day.tasksCompleted || 0;
            if (productivity > maxProductivity) {
                maxProductivity = productivity;
                productiveDay = day.date;
            }
        });

        return productiveDay;
    };

    const calculateProgressTrend = () => {
        if (timelineData.length < 7) return 0;

        const lastWeek = timelineData.slice(-7);
        const firstProgress = lastWeek[0].totalProgress || lastWeek[0].progress || 0;
        const lastProgress = lastWeek[lastWeek.length - 1].totalProgress || lastWeek[lastWeek.length - 1].progress || 0;

        return parseFloat(((lastProgress - firstProgress) / Math.max(1, firstProgress) * 100).toFixed(1));
    };

    // Around line 66
    const loadAllMembers = async () => {
        try {
            console.log('🔄 Loading members...');

            // Test if ApiService.getMembers() works
            const response = await ApiService.getMembers();
            console.log('📡 Members API response:', response);

            // Handle different response structures
            let membersArray = [];

            if (Array.isArray(response)) {
                membersArray = response;
            } else if (response && Array.isArray(response.users)) {
                membersArray = response.users;
            } else if (response && Array.isArray(response.data)) {
                membersArray = response.data;
            }

            console.log(`👥 Found ${membersArray.length} members`);

            // Format members
            const formattedMembers = membersArray.map(member => ({
                id: member.id || member.user_id,
                email: member.email || '',
                name: member.email ? member.email.split('@')[0].replace(/\./g, ' ') : `Member ${member.id}`,
                role: member.role
            }));

            setAllMembers(formattedMembers);
            setMembers(formattedMembers);

        } catch (error) {
            console.error('❌ Error loading members:', error);
            setAllMembers([]);
            setMembers([]);
        }
    };
    const getMembers = async () => {
        try {
            // Replace with your actual API call
            const response = await fetch('/api/members'); // Your endpoint
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching members:", error);
            return { users: [] };
        }
    };
    const loadMemberStatistics = async (memberId) => {
        try {
            setLoading(true);
            console.log('📊 Loading stats for member:', memberId);

            if (memberId === 'all') {
                setFilteredProjectsKPI(projectsKPI);
                setShowMemberStats(false);
                setSelectedMember('all');
                setMemberStats(null);
                // Load timeline for all projects
                loadTimelineData();
                return;
            }

            // Load member statistics
            const response = await ApiService.getMemberStatistics(memberId);
            console.log('✅ Member statistics from API:', response);

            if (!response || !response.member) {
                console.error('❌ Invalid response from member statistics API');
                setFilteredProjectsKPI(projectsKPI);
                setShowMemberStats(false);
                setSelectedMember('all');
                return;
            }

            // Update filtered projects with member's projects
            setFilteredProjectsKPI(response.projects || []);

            // Create project stats for breakdown
            const projectStats = (response.projects || []).map(project => ({
                projectId: project.projectId,
                projectName: project.projectName,
                totalTasks: project.totalTasks,
                completedTasks: project.doneTasks,
                completionRate: project.completionRate
            }));

            // Set detailed member statistics
            setMemberStats({
                member: response.member,
                totalProjects: response.summary.totalProjects,
                totalTasks: response.summary.totalTasks,
                completedTasks: response.summary.completedTasks,
                overallCompletionRate: response.summary.overallCompletionRate,
                avgTasksPerDay: response.summary.avgTasksPerDay,
                projectStats: projectStats,
                productivity: response.summary.productivity
            });

            setShowMemberStats(true);
            setSelectedMember(memberId);

            // Load member-specific timeline data
            loadTimelineData(memberId);

        } catch (error) {
            console.error('❌ Failed to load member statistics:', error);
            setFilteredProjectsKPI(projectsKPI);
            setShowMemberStats(false);
            setSelectedMember('all');
            setMemberStats(null);
        } finally {
            setLoading(false);
        }
    };
    const loadAllProjectsStatistics = async () => {
        try {
            setLoading(true);
            console.log('📊 Loading all projects statistics...');

            // Load members first
            await loadAllMembers();

            // Load statistics
            const projectsData = await ApiService.getProjectsByStats();
            console.log('✅ Projects data from getProjectsByStats():', projectsData);

            if (!projectsData) {
                console.error('❌ projectsData is null or undefined');
                setProjectsKPI([]);
                setFilteredProjectsKPI([]);
                setAllProjectsStats({ totalTasks: 0, completedTasks: 0, completionRate: 0, totalProjects: 0 });
                return;
            }

            const projects = projectsData.projects || [];
            console.log(`📊 Extracted ${projects.length} projects from projectsData`);

            // Fetch detailed statistics for each project to get member emails
            const projectsWithMembers = await Promise.all(
                projects.map(async (project) => {
                    try {
                        const projectStats = await ApiService.getProjectStatistics(project.projectId);
                        return {
                            ...project,
                            memberStats: projectStats.memberStats || [],
                            totalMembers: projectStats.totalMembers || 0
                        };
                    } catch (error) {
                        console.error(`Error loading details for project ${project.projectId}:`, error);
                        return {
                            ...project,
                            memberStats: [],
                            totalMembers: 0
                        };
                    }
                })
            );

            // Also get summary separately for global stats
            const summary = await ApiService.getStatisticsSummary();

            setAllProjectsStats(summary);
            setProjectsKPI(projectsWithMembers);
            setFilteredProjectsKPI(projectsWithMembers);
            setSelectedMember('all');
            setShowMemberStats(false);

        } catch (error) {
            console.error('❌ Failed to load statistics:', error);
            setProjectsKPI([]);
            setFilteredProjectsKPI([]);
            setAllProjectsStats({
                totalTasks: 0,
                completedTasks: 0,
                completionRate: 0,
                totalProjects: 0
            });
        } finally {
            setLoading(false);
        }
    };

    // Add a cache state
    const [timelineCache, setTimelineCache] = useState({
        project: null,
        member: null,
        all: null
    });

    // Update loadTimelineData function
    const loadTimelineData = async (memberId = null) => {
        try {
            setTimelineLoading(true);

            // Create a consistent cache key based on current state
            const cacheKey = memberId && memberId !== 'all' ?
                `member_${memberId}` :
                selectedProject?.project_id ?
                    `project_${selectedProject.project_id}` :
                    'all_projects';

            // Check cache first
            if (timelineCache[cacheKey]?.data) {
                setTimelineData(timelineCache[cacheKey].data);
                setTimelineInsights(timelineCache[cacheKey].insights);
                setTimelineLoading(false);
                return;
            }

            let response;

            // Determine what type of timeline to load
            if (memberId && memberId !== 'all') {
                console.log('📊 Loading member timeline for member:', memberId);

                // Use deterministic timeline generator
                const timelineData = generateRealisticTimelineData(memberId);
                const insights = generateDynamicMemberInsights(timelineData);

                response = {
                    timelineData,
                    insights
                };
            } else if (selectedProject?.project_id) {
                // For single project
                console.log('📊 Loading project timeline for:', selectedProject['project-name']);

                // Use deterministic timeline generator
                const timelineData = generateRealisticTimelineData();
                const insights = generateDynamicProjectInsights(timelineData);

                response = {
                    timelineData,
                    insights
                };
            } else {
                // For all projects
                console.log('📊 Loading all projects timeline');

                // Use deterministic timeline generator
                const timelineData = generateRealisticTimelineData();
                const insights = generateDynamicAllProjectsInsights(timelineData);

                response = {
                    timelineData,
                    insights
                };
            }

            if (response && response.timelineData) {
                console.log('✅ Timeline data loaded:', {
                    length: response.timelineData.length,
                    type: memberId ? 'member' : selectedProject ? 'project' : 'all'
                });

                const timelineData = response.timelineData;
                const insights = response.insights || generateDynamicInsights(timelineData, cacheKey);

                setTimelineData(timelineData);
                setTimelineInsights(insights);

                // Cache the data with the consistent key
                setTimelineCache(prev => ({
                    ...prev,
                    [cacheKey]: {
                        timestamp: Date.now(),
                        data: timelineData,
                        insights: insights
                    }
                }));
            }
        } catch (error) {
            console.error('❌ Failed to load timeline data:', error);
            // Generate deterministic data based on current stats
            const timelineData = generateRealisticTimelineData(memberId);
            const insights = generateDynamicInsights(
                timelineData,
                memberId ? `member_${memberId}` : selectedProject ? `project_${selectedProject.project_id}` : 'all_projects'
            );

            setTimelineData(timelineData);
            setTimelineInsights(insights);
        } finally {
            setTimelineLoading(false);
        }
    };

    // Helper function to generate dynamic insights
    const generateDynamicInsights = (data, cacheKey) => {
        if (!data || data.length === 0) {
            return getDefaultInsights(cacheKey.includes('member') ? 'member' :
                cacheKey.includes('project') ? 'project' : 'all');
        }

        if (cacheKey.includes('member')) {
            return generateDynamicMemberInsights(data);
        } else if (cacheKey.includes('project')) {
            return generateDynamicProjectInsights(data);
        } else {
            return generateDynamicAllProjectsInsights(data);
        }
    };
    // Helper function to generate insights from data
    const generateInsightsFromData = (data, type) => {
        if (!data || data.length === 0) {
            return getDefaultInsights(type);
        }

        switch (type) {
            case 'member':
                return generateDynamicMemberInsights(data);
            case 'project':
                return generateDynamicProjectInsights(data);
            default:
                return generateDynamicAllProjectsInsights(data);
        }
    };

    // Default insights
    const getDefaultInsights = (type) => {
        const base = {
            currentProgress: 0,
            averageDailyProgress: 0,
            consistencyScore: 0
        };

        if (type === 'member') {
            return {
                ...base,
                memberProgress: 0,
                memberProductivity: 0,
                activeDays: 0
            };
        }

        return base;
    };

    // Helper function to generate member timeline from stats
    const generateMemberTimelineFromStats = (memberStats) => {
        const now = new Date();
        const timelineData = [];
        const member = memberStats?.member || {};
        const summary = memberStats?.summary || {};
        const projects = memberStats?.projects || [];

        // Base metrics from member stats
        const baseProgress = summary.overallCompletionRate || 50;
        const totalCompleted = summary.completedTasks || 0;
        const totalAssigned = summary.totalTasks || 10;
        const memberProductivity = summary.productivity || 60;

        // Generate 30 days of member-specific timeline data
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);

            const dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            // Calculate daily progress (simulated)
            const dailyProgress = Math.min(baseProgress * (i / 30) * (1 - (i / 30) * 0.3), 100);
            const variation = Math.sin(i * 0.5) * 3 + Math.random() * 2;
            const memberProgress = Math.min(dailyProgress + variation, 100);

            // Simulate task completion pattern (more active on weekdays)
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const baseTasks = isWeekend ? 0.5 : 2;
            const dailyCompleted = Math.floor(baseTasks + Math.random() * 2);

            // Calculate cumulative tasks
            const cumulativeTasks = Math.min(
                Math.floor(totalCompleted * (i / 30) * 1.2) + dailyCompleted,
                totalCompleted
            );

            // Simulate productivity (higher on productive days)
            const dailyProductivity = Math.min(
                memberProductivity + Math.sin(i * 0.3) * 10 + Math.random() * 15,
                100
            );

            timelineData.push({
                date: dateStr,
                memberProgress: parseFloat(memberProgress.toFixed(1)),
                memberTasksCompleted: cumulativeTasks,
                dailyCompletedTasks: dailyCompleted,
                memberProductivity: parseFloat(dailyProductivity.toFixed(1)),
                assignedTasks: totalAssigned,
                activeProjects: summary.totalProjects || projects.length || 1,
                completionRate: parseFloat(((cumulativeTasks / totalAssigned) * 100).toFixed(1)),
                focusScore: parseFloat((70 + Math.sin(i) * 15).toFixed(1)), // Simulated focus metric
                efficiencyScore: parseFloat((memberProgress * 0.6 + dailyProductivity * 0.4).toFixed(1))
            });
        }

        return timelineData;
    };


    // Add this helper function
    const calculateActualProjectProgress = (project) => {
        if (!project) return 0;

        const { doneTasks = 0, totalTasks = 0, daysElapsed = 0, projectDuration = 0 } = project;

        // Calculate completion rate
        const completionRate = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

        // Calculate timeline progress
        const timelineProgress = projectDuration > 0 ? (daysElapsed / projectDuration) * 100 : 0;

        // Return weighted average
        return (completionRate * 0.7 + timelineProgress * 0.3);
    };
    // Helper function to generate member timeline insights
    const generateMemberTimelineInsights = (memberStats) => {
        const timelineData = generateMemberTimelineFromStats(memberStats);

        // Calculate insights from the timeline data
        const memberProgressValues = timelineData.map(d => d.memberProgress);
        const productivityValues = timelineData.map(d => d.memberProductivity);
        const taskValues = timelineData.map(d => d.dailyCompletedTasks);

        // Find most productive day
        let mostProductiveDay = { date: '', tasks: 0, productivity: 0 };
        timelineData.forEach(day => {
            if (day.dailyCompletedTasks > mostProductiveDay.tasks) {
                mostProductiveDay = {
                    date: day.date,
                    tasks: day.dailyCompletedTasks,
                    productivity: day.memberProductivity
                };
            }
        });

        // Calculate progress trend (last 7 days vs previous 7 days)
        const recentWeek = timelineData.slice(-7);
        const previousWeek = timelineData.slice(-14, -7);

        const recentAvgProgress = recentWeek.reduce((sum, day) => sum + day.memberProgress, 0) / recentWeek.length;
        const previousAvgProgress = previousWeek.reduce((sum, day) => sum + day.memberProgress, 0) / previousWeek.length;
        const progressTrend = recentAvgProgress - previousAvgProgress;

        // Calculate active days
        const activeDays = timelineData.filter(day => day.dailyCompletedTasks > 0).length;

        // Calculate consistency (standard deviation of daily progress)
        const avgProgress = memberProgressValues.reduce((a, b) => a + b, 0) / memberProgressValues.length;
        const squaredDiffs = memberProgressValues.map(value => Math.pow(value - avgProgress, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
        const consistencyScore = Math.max(0, 100 - Math.sqrt(avgSquaredDiff) * 2);

        return {
            memberProgress: timelineData[timelineData.length - 1]?.memberProgress || 0,
            averageDailyProgress: parseFloat((memberProgressValues.reduce((a, b) => a + b, 0) / memberProgressValues.length).toFixed(1)),
            mostProductiveDay: mostProductiveDay,
            memberProductivity: parseFloat((productivityValues.reduce((a, b) => a + b, 0) / productivityValues.length).toFixed(1)),
            activeDays: activeDays,
            progressTrend: parseFloat(progressTrend.toFixed(1)),
            consistencyScore: parseFloat(consistencyScore.toFixed(1)),
            avgTasksPerDay: parseFloat((taskValues.reduce((a, b) => a + b, 0) / taskValues.length).toFixed(1)),
            peakProductivity: Math.max(...productivityValues),
            currentFocusScore: timelineData[timelineData.length - 1]?.focusScore || 0,
            currentEfficiencyScore: timelineData[timelineData.length - 1]?.efficiencyScore || 0
        };
    };

    // Updated sample data generator with member support
    // Replace generateRealisticTimelineData function with this:
    const generateRealisticTimelineData = (memberId = null) => {
        const now = new Date();
        const data = [];
        const isSingleProject = selectedProject?.project_id;
        const isMemberView = memberId && memberId !== 'all';

        // Use a deterministic seed based on project/member ID for consistent data
        const getDeterministicValue = (base, index, maxVariation = 0.2) => {
            const seed = (selectedProject?.project_id || memberId || 'all').toString();
            const seedNumber = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const variation = Math.sin(index * 0.5 + seedNumber) * maxVariation;
            return base * (1 + variation);
        };

        if (isSingleProject) {
            // Get the actual project from filteredProjectsKPI
            const project = filteredProjectsKPI[0];
            if (!project) return [];

            const {
                totalTasks = 0,
                doneTasks = 0,
                todoTasks = 0,
                inProgressTasks = 0,
                daysElapsed = Math.max(project.daysElapsed || 0, 1),
                projectDuration = project.projectDuration || 90,
                completionRate = project.completionRate || 0,
                totalMembers = project.totalMembers || 1
            } = project;

            // Generate timeline based on actual completion rate and tasks
            for (let i = Math.min(daysElapsed, 60); i >= 0; i--) {
                const date = new Date();
                date.setDate(now.getDate() - i);

                const dateStr = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });

                // Calculate day in project timeline (0 = start, 1 = end)
                const projectDay = daysElapsed - i;
                const projectProgressRatio = projectDay / Math.max(1, daysElapsed);

                // Calculate cumulative progress (s-curve: slow start, faster middle, slow finish)
                let progressCurve;
                if (projectProgressRatio < 0.2) {
                    // Slow start: 0-20%
                    progressCurve = 0.2 * Math.pow(projectProgressRatio / 0.2, 2);
                } else if (projectProgressRatio < 0.8) {
                    // Fast middle: 20-80%
                    progressCurve = 0.2 + 0.6 * ((projectProgressRatio - 0.2) / 0.6);
                } else {
                    // Slow finish: 80-100%
                    progressCurve = 0.8 + 0.2 * (1 - Math.pow((1 - projectProgressRatio) / 0.2, 2));
                }

                // Apply actual completion rate to the curve
                const progress = completionRate * progressCurve;

                // Calculate tasks based on progress
                const cumulativeCompleted = Math.floor(doneTasks * progressCurve);
                const totalSoFar = Math.floor(totalTasks * (0.3 + progressCurve * 0.7));

                // Calculate daily values (deterministic based on day index)
                const dailyVariation = Math.sin(i * 0.3) * 0.3 + Math.cos(i * 0.7) * 0.2;
                const dailyNewTasks = Math.max(0, Math.floor(
                    (totalTasks / Math.max(1, daysElapsed)) * (0.8 + dailyVariation)
                ));

                const dailyCompletedTasks = Math.max(0, Math.floor(
                    (doneTasks / Math.max(1, daysElapsed)) * (0.7 + Math.sin(i * 0.5) * 0.3)
                ));

                // Calculate remaining tasks distribution
                const remaining = totalSoFar - cumulativeCompleted;
                const todoOnDay = Math.floor(remaining * 0.6);
                const inProgressOnDay = remaining - todoOnDay;

                data.unshift({
                    date: dateStr,
                    progress: parseFloat(Math.min(progress, 100).toFixed(1)),
                    tasksCompleted: cumulativeCompleted,
                    tasksCreated: totalSoFar,
                    dailyNewTasks: dailyNewTasks,
                    dailyCompletedTasks: dailyCompletedTasks,
                    activeMembers: Math.max(1, Math.floor(totalMembers * (0.5 + Math.sin(i * 0.2) * 0.3))),
                    todoTasks: todoOnDay,
                    inProgressTasks: inProgressOnDay,
                    projectEfficiency: parseFloat((progress * 0.6 + (dailyCompletedTasks / Math.max(1, dailyNewTasks)) * 40).toFixed(1))
                });
            }
        } else if (isMemberView) {
            // Member view - use memberStats for realistic data
            const memberData = memberStats || {};
            const {
                totalTasks = 0,
                completedTasks = 0,
                totalProjects = 0,
                overallCompletionRate = 0
            } = memberData;

            // Generate 60 days of member data
            for (let i = 60; i >= 0; i--) {
                const date = new Date();
                date.setDate(now.getDate() - i);

                const dateStr = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });

                // Calculate based on day index (deterministic)
                const dayRatio = i / 60;

                // Member progress curve (starts slower, accelerates)
                const progressCurve = 1 - Math.pow(dayRatio, 1.5);
                const memberProgress = overallCompletionRate * progressCurve;

                // Cumulative tasks (deterministic growth)
                const cumulativeTasks = Math.floor(completedTasks * progressCurve);

                // Daily completed (higher on middle days, lower on start/end)
                const dailyPattern = Math.sin((i / 60) * Math.PI); // Sine wave pattern
                const dailyCompleted = Math.max(0, Math.floor(
                    (completedTasks / 60) * (0.5 + dailyPattern * 0.5)
                ));

                // Productivity based on day of week (deterministic)
                const dayOfWeek = date.getDay();
                const weekdayFactor = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 1.2 : 0.7;
                const memberProductivity = memberProgress * weekdayFactor * (0.8 + Math.sin(i * 0.2) * 0.2);

                data.unshift({
                    date: dateStr,
                    memberProgress: parseFloat(Math.min(memberProgress, 100).toFixed(1)),
                    memberTasksCompleted: cumulativeTasks,
                    dailyCompletedTasks: dailyCompleted,
                    memberProductivity: parseFloat(Math.min(memberProductivity, 100).toFixed(1)),
                    assignedTasks: totalTasks,
                    activeProjects: Math.max(1, Math.floor(totalProjects * (0.4 + Math.sin(i * 0.3) * 0.3))),
                    completionRate: parseFloat(((cumulativeTasks / Math.max(1, totalTasks)) * 100).toFixed(1))
                });
            }
        } else {
            // All projects view
            const totalTasks = allProjectsStats?.totalTasks || 0;
            const completedTasks = allProjectsStats?.completedTasks || 0;
            const overallCompletion = allProjectsStats?.completionRate || 0;
            const totalProjects = filteredProjectsKPI.length;

            // Generate 60 days of aggregated data
            for (let i = 60; i >= 0; i--) {
                const date = new Date();
                date.setDate(now.getDate() - i);

                const dateStr = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });

                const dayRatio = i / 60;

                // Progress curve for all projects
                const progressCurve = 1 - Math.pow(dayRatio, 1.2);
                const progress = overallCompletion * progressCurve;

                // Cumulative values (deterministic)
                const cumulativeCompleted = Math.floor(completedTasks * progressCurve);
                const cumulativeTotal = Math.floor(totalTasks * (0.2 + progressCurve * 0.8));

                // Daily patterns (deterministic based on day index)
                const dailyPattern = 0.5 + Math.sin(i * 0.4) * 0.3 + Math.cos(i * 0.2) * 0.2;
                const dailyNewTasks = Math.max(1, Math.floor(
                    (totalTasks / 60) * dailyPattern
                ));

                const dailyCompleted = Math.max(0, Math.floor(
                    (completedTasks / 60) * (0.4 + Math.sin(i * 0.3) * 0.3)
                ));

                // Active projects (fluctuates but deterministic)
                const baseActiveProjects = Math.max(1, Math.floor(totalProjects * 0.7));
                const activeVariation = Math.sin(i * 0.2) * 0.3;
                const activeProjects = Math.max(1, Math.floor(baseActiveProjects * (1 + activeVariation)));

                data.unshift({
                    date: dateStr,
                    totalProgress: parseFloat(Math.min(progress, 100).toFixed(1)),
                    completedTasks: cumulativeCompleted,
                    newTasks: cumulativeTotal,
                    dailyNewTasks: dailyNewTasks,
                    dailyCompletedTasks: dailyCompleted,
                    activeProjects: activeProjects,
                    activeMembers: Math.floor(activeProjects * 2.5), // ~2.5 members per project
                    productivity: parseFloat(Math.min(progress * (0.8 + Math.sin(i * 0.2) * 0.2), 100).toFixed(1)),
                    teamEfficiency: parseFloat((progress * 0.6 + (dailyCompleted / Math.max(1, dailyNewTasks)) * 40).toFixed(1))
                });
            }
        }

        return data;
    };
    // Helper function to generate dynamic member insights
    const generateDynamicMemberInsights = (data) => {
        if (!data || data.length === 0) {
            return {
                memberProgress: 0,
                averageDailyProgress: 0,
                mostProductiveDay: null,
                memberProductivity: 0,
                activeDays: 0,
                progressTrend: 0,
                consistencyScore: 0
            };
        }

        const progressValues = data.map(d => d.memberProgress);
        const productivityValues = data.map(d => d.memberProductivity);
        const taskValues = data.map(d => d.dailyCompletedTasks);

        // Find most productive day
        let mostProductiveDay = { date: '', tasks: 0, productivity: 0 };
        data.forEach(day => {
            if (day.dailyCompletedTasks > mostProductiveDay.tasks) {
                mostProductiveDay = {
                    date: day.date,
                    tasks: day.dailyCompletedTasks,
                    productivity: day.memberProductivity
                };
            }
        });

        // Calculate progress trend (last 7 days vs previous 7 days)
        const recentWeek = data.slice(-7);
        const previousWeek = data.slice(-14, -7);

        const recentAvgProgress = recentWeek.reduce((sum, day) => sum + day.memberProgress, 0) / recentWeek.length;
        const previousAvgProgress = previousWeek.reduce((sum, day) => sum + day.memberProgress, 0) / previousWeek.length;
        const progressTrend = recentAvgProgress - previousAvgProgress;

        // Calculate active days
        const activeDays = data.filter(day => day.dailyCompletedTasks > 0).length;

        // Calculate consistency (standard deviation of daily progress)
        const avgProgress = progressValues.reduce((a, b) => a + b, 0) / progressValues.length;
        const squaredDiffs = progressValues.map(value => Math.pow(value - avgProgress, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
        const consistencyScore = Math.max(0, 100 - Math.sqrt(avgSquaredDiff) * 1.5);

        // Calculate average daily progress
        const progressChanges = [];
        for (let i = 1; i < progressValues.length; i++) {
            progressChanges.push(progressValues[i] - progressValues[i - 1]);
        }
        const averageDailyProgress = progressChanges.length > 0
            ? progressChanges.reduce((a, b) => a + b, 0) / progressChanges.length
            : 0;

        return {
            memberProgress: data[data.length - 1]?.memberProgress || 0,
            averageDailyProgress: parseFloat(averageDailyProgress.toFixed(1)),
            mostProductiveDay: mostProductiveDay.tasks > 0 ? mostProductiveDay : null,
            memberProductivity: parseFloat((productivityValues.reduce((a, b) => a + b, 0) / productivityValues.length).toFixed(1)),
            activeDays: activeDays,
            progressTrend: parseFloat(progressTrend.toFixed(1)),
            consistencyScore: parseFloat(consistencyScore.toFixed(1)),
            avgTasksPerDay: parseFloat((taskValues.reduce((a, b) => a + b, 0) / taskValues.length).toFixed(1)),
            peakProductivity: Math.max(...productivityValues),
            currentFocusScore: data[data.length - 1]?.focusScore || 0,
            currentEfficiencyScore: data[data.length - 1]?.efficiencyScore || 0,
            taskCompletionRate: parseFloat(((data[data.length - 1]?.completionRate || 0) / 100).toFixed(2))
        };
    };

    // Helper function to generate dynamic project insights
    const generateDynamicProjectInsights = (data) => {
        if (!data || data.length === 0) {
            return {
                currentProgress: 0,
                averageDailyProgress: 0,
                peakProgressDay: null,
                progressTrend: 0,
                productivityScore: 0,
                consistencyScore: 0
            };
        }

        const progressValues = data.map(d => d.progress);
        const taskValues = data.map(d => d.dailyCompletedTasks);

        // Find peak progress day
        let peakProgressDay = { date: '', progressIncrease: 0 };
        for (let i = 1; i < data.length; i++) {
            const progressIncrease = data[i].progress - data[i - 1].progress;
            if (progressIncrease > peakProgressDay.progressIncrease) {
                peakProgressDay = {
                    date: data[i].date,
                    progressIncrease: progressIncrease
                };
            }
        }

        // Calculate progress trend
        const recentWeek = data.slice(-7);
        const firstProgress = recentWeek[0]?.progress || 0;
        const lastProgress = recentWeek[recentWeek.length - 1]?.progress || 0;
        const progressTrend = ((lastProgress - firstProgress) / Math.max(1, firstProgress)) * 100;

        // Calculate average daily progress
        const progressChanges = [];
        for (let i = 1; i < progressValues.length; i++) {
            progressChanges.push(progressValues[i] - progressValues[i - 1]);
        }
        const averageDailyProgress = progressChanges.length > 0
            ? progressChanges.reduce((a, b) => a + b, 0) / progressChanges.length
            : 0;

        // Calculate productivity score
        const totalCompletedTasks = taskValues.reduce((a, b) => a + b, 0);
        const productivityScore = totalCompletedTasks / data.length;

        // Calculate consistency
        const avgProgress = progressValues.reduce((a, b) => a + b, 0) / progressValues.length;
        const squaredDiffs = progressValues.map(value => Math.pow(value - avgProgress, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
        const consistencyScore = Math.max(0, 100 - Math.sqrt(avgSquaredDiff) * 2);

        return {
            currentProgress: data[data.length - 1]?.progress || 0,
            averageDailyProgress: parseFloat(averageDailyProgress.toFixed(1)),
            peakProgressDay: peakProgressDay.progressIncrease > 0 ? peakProgressDay : null,
            progressTrend: parseFloat(progressTrend.toFixed(1)),
            productivityScore: parseFloat(productivityScore.toFixed(1)),
            consistencyScore: parseFloat(consistencyScore.toFixed(1)),
            teamEngagement: parseFloat((data[data.length - 1]?.activeMembers / Math.max(1, selectedProject?.totalMembers || 3) * 100).toFixed(1)),
            completionVelocity: parseFloat((averageDailyProgress * 7).toFixed(1)) // Weekly velocity
        };
    };

    // Helper function to generate dynamic all projects insights
    const generateDynamicAllProjectsInsights = (data) => {
        if (!data || data.length === 0) {
            return {
                overallProgress: 0,
                averageDailyProductivity: 0,
                mostProductiveDay: null,
                progressTrend: 0,
                averageActiveProjects: 0,
                teamEfficiency: 0
            };
        }

        const progressValues = data.map(d => d.totalProgress);
        const productivityValues = data.map(d => d.productivity);
        const activeProjectValues = data.map(d => d.activeProjects);

        // Find most productive day
        let mostProductiveDay = { date: '', productivity: 0 };
        data.forEach(day => {
            if (day.productivity > mostProductiveDay.productivity) {
                mostProductiveDay = {
                    date: day.date,
                    productivity: day.productivity
                };
            }
        });

        // Calculate progress trend
        const recentWeek = data.slice(-7);
        const firstProgress = recentWeek[0]?.totalProgress || 0;
        const lastProgress = recentWeek[recentWeek.length - 1]?.totalProgress || 0;
        const progressTrend = ((lastProgress - firstProgress) / Math.max(1, firstProgress)) * 100;

        // Calculate averages
        const averageDailyProductivity = productivityValues.reduce((a, b) => a + b, 0) / productivityValues.length;
        const averageActiveProjects = activeProjectValues.reduce((a, b) => a + b, 0) / activeProjectValues.length;

        // Calculate team efficiency
        const teamEfficiency = data[data.length - 1]?.teamEfficiency || 0;

        // Calculate project distribution
        const maxProjects = Math.max(...activeProjectValues);
        const minProjects = Math.min(...activeProjectValues);
        const projectStability = parseFloat(((averageActiveProjects / Math.max(1, maxProjects)) * 100).toFixed(1));

        return {
            overallProgress: data[data.length - 1]?.totalProgress || 0,
            averageDailyProductivity: parseFloat(averageDailyProductivity.toFixed(1)),
            mostProductiveDay: mostProductiveDay.productivity > 0 ? mostProductiveDay : null,
            progressTrend: parseFloat(progressTrend.toFixed(1)),
            averageActiveProjects: parseFloat(averageActiveProjects.toFixed(1)),
            teamEfficiency: parseFloat(teamEfficiency.toFixed(1)),
            projectStability: projectStability,
            peakProductivity: Math.max(...productivityValues),
            totalTaskThroughput: parseFloat((data.reduce((sum, day) => sum + day.dailyCompletedTasks, 0)).toFixed(0)),
            teamProductivityTrend: parseFloat(((productivityValues[productivityValues.length - 1] - productivityValues[0]) / Math.max(1, productivityValues[0]) * 100).toFixed(1))
        };
    };


    useEffect(() => {
        console.log('🔍 ProjectStatistics Props:', {
            selectedProject,
            hasSelectedProject: !!selectedProject,
            projectId: selectedProject?.project_id,
            projectName: selectedProject?.['project-name']
        });

        // Load statistics
        if (selectedProject?.project_id) {
            console.log('🚀 Loading stats for project:', selectedProject['project-name']);
            loadAllProjectsStatistics();
            // Don't clear cache here - let loadTimelineData handle it
        } else {
            console.log('⚠️ No valid project selected, loading all projects stats');
            loadAllProjectsStatistics();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProject]);

    // Add another useEffect to load timeline when data is ready
    useEffect(() => {
        if (filteredProjectsKPI.length > 0 || memberStats) {
            loadTimelineData(selectedMember);
        }
    }, [filteredProjectsKPI, memberStats, selectedMember]);
    // Handle member filter change
    const handleMemberFilterChange = (memberId) => {
        console.log('🔧 Filter changed to member:', memberId);
        if (memberId === 'all') {
            setSelectedMember('all');
            setFilteredProjectsKPI(projectsKPI);
            setShowMemberStats(false);
            setMemberStats(null);
        } else {
            loadMemberStatistics(memberId);
        }
    };

    const loadProjectStatistics = async (projectId) => {
        try {
            setLoading(true);
            console.log('📊 Loading statistics for project:', projectId);

            const response = await ApiService.getProjectStatistics(projectId);
            console.log('📊 Project statistics response:', response);

            if (response) {
                // Create a single project KPI array (same format as getAllProjectsStatistics)
                const singleProjectKPI = [{
                    projectId: projectId,
                    projectName: response.projectName || selectedProject?.['project-name'] || 'Project',
                    totalTasks: response.totalTasks || 0,
                    todoTasks: response.todoTasks || 0,
                    inProgressTasks: response.inProgressTasks || 0,
                    doneTasks: response.doneTasks || 0,
                    completionRate: response.completionRate || 0,
                    projectDuration: response.projectDuration || 0,
                    daysRemaining: response.daysRemaining || 0,
                    daysElapsed: response.daysElapsed || 0,
                    progressPercentage: response.progressPercentage || 0,
                    startDate: response.startDate || '',
                    endDate: response.endDate || '',
                    memberStats: response.memberStats || [],
                    totalMembers: response.totalMembers || 0,
                    assignedTasks: response.assignedTasks || 0,
                    unassignedTasks: response.unassignedTasks || 0
                }];

                // Create summary stats for the single project
                const summary = {
                    totalTasks: response.totalTasks || 0,
                    completedTasks: response.doneTasks || 0,
                    completionRate: response.completionRate || 0,
                    totalProjects: 1
                };

                // Set the same state variables as getAllProjectsStatistics
                setAllProjectsStats(summary);
                setProjectsKPI(singleProjectKPI);
                setFilteredProjectsKPI(singleProjectKPI);
                setSelectedMember('all');
                setShowMemberStats(false);
            }
        } catch (error) {
            console.error('❌ Failed to load project statistics:', error);
            setError(error.message);
            // Set empty state on error
            setAllProjectsStats({
                totalTasks: 0,
                completedTasks: 0,
                completionRate: 0,
                totalProjects: 0
            });
            setProjectsKPI([]);
            setFilteredProjectsKPI([]);
        } finally {
            setLoading(false);
        }
    };

    // Reset filters
    const resetFilters = () => {
        setSelectedMember('all');
        setFilteredProjectsKPI(projectsKPI);
        setShowMemberStats(false);
        setMemberStats(null);
    };

    // Show individual project statistics when a project is selected
    // Replace the problematic section with this:

    // Show individual project statistics when a project is selected
    // Show individual project statistics when a project is selected
    if (selectedProject?.project_id) {
        // Show loading spinner while fetching
        if (loading && !stats.projectId) {
            return <LoadingSpinner message={`Loading statistics for ${selectedProject['project-name']}...`} />;
        }
        // Return actual project statistics view
        return (
            <div style={{
                padding: '30px',
                width: '100%',
                maxWidth: 'none',
                margin: '0',
                background: '#f5f7fa',
                minHeight: '100vh'
            }}>
                {/* Header - Full Width */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '40px',
                    borderRadius: '20px',
                    color: 'white',
                    marginBottom: '30px',
                    boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
                    width: '100%'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '20px',
                        maxWidth: '100%'
                    }}>
                        <div style={{ flex: 2, minWidth: '300px' }}>
                            <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '700' }}>
                                📊 Projects KPI Dashboard
                            </h1>
                            <p style={{ margin: 0, fontSize: '16px', opacity: 0.95, marginBottom: '20px' }}>
                                Comprehensive statistics across all your projects
                            </p>
                            {user.role === 'ADMIN' && (
                                <div>
                                    {/* Member Filter */}
                                    <div style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        padding: '15px',
                                        borderRadius: '12px',
                                        maxWidth: '500px'
                                    }}>
                                        <div style={{
                                            fontSize: '14px',
                                            marginBottom: '10px',
                                            fontWeight: '500'
                                        }}>
                                            👥 Filter by Team Member:
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            gap: '10px',
                                            alignItems: 'center',
                                            flexWrap: 'wrap'
                                        }}>
                                            <select
                                                value={selectedMember}
                                                onChange={(e) => handleMemberFilterChange(e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    minWidth: '250px',
                                                    padding: '10px 15px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: 'white',
                                                    color: '#333',
                                                    fontSize: '14px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="all">👥 All Members (All Projects)</option>
                                                {members.map(member => (
                                                    <option key={member.id} value={member.id}>
                                                        👤 {member.email?.split('@')[0]?.replace(/\./g, ' ') || `Member ${member.id}`}
                                                    </option>
                                                ))}
                                            </select>

                                            {selectedMember !== 'all' && (
                                                <button
                                                    onClick={resetFilters}
                                                    style={{
                                                        padding: '10px 20px',
                                                        background: 'rgba(255,255,255,0.9)',
                                                        color: '#667eea',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        fontSize: '14px',
                                                        transition: 'all 0.3s ease',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'white';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    Reset Filter
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* View Mode Buttons */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            background: 'rgba(255,255,255,0.2)',
                            padding: '15px',
                            borderRadius: '12px',
                            minWidth: '200px'
                        }}>
                            <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>
                                View Mode:
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    style={{
                                        padding: '10px 20px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: viewMode === 'grid' ? 'white' : 'transparent',
                                        color: viewMode === 'grid' ? '#667eea' : 'white',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        transition: 'all 0.3s ease',
                                        flex: 1
                                    }}>
                                    🔲 Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        padding: '10px 20px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: viewMode === 'list' ? 'white' : 'transparent',
                                        color: viewMode === 'list' ? '#667eea' : 'white',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        transition: 'all 0.3s ease',
                                        flex: 1
                                    }}>
                                    📋 List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area - Full Width Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '25px',
                    marginBottom: '30px',
                    width: '100%'
                }}>
                    {/* Summary Cards - Full Width */}
                    <div style={{
                        gridColumn: '1 / -1',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '20px'
                    }}>
                        <SummaryCard
                            icon="📁"
                            title="Total Projects"
                            value={filteredProjectsKPI.length}
                            color="#667eea"
                            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        />
                        <SummaryCard
                            icon="📝"
                            title="Total Tasks"
                            value={allProjectsStats?.totalTasks || 0}
                            color="#4ecdc4"
                            gradient="linear-gradient(135deg, #4ecdc4 0%, #44a3a0 100%)"
                        />
                        <SummaryCard
                            icon="✅"
                            title="Completed Tasks"
                            value={allProjectsStats?.completedTasks || 0}
                            color="#a8e6cf"
                            gradient="linear-gradient(135deg, #a8e6cf 0%, #88d8b0 100%)"
                        />
                        <SummaryCard
                            icon="📈"
                            title="Overall Completion"
                            value={`${allProjectsStats?.completionRate || 0}%`}
                            color="#ffd93d"
                            gradient="linear-gradient(135deg, #ffd93d 0%, #ffb703 100%)"
                        />
                    </div>

                    {/* Member Statistics - Full Width when shown */}
                    {showMemberStats && memberStats && (
                        <div style={{
                            gridColumn: '1 / -1',
                            background: 'linear-gradient(135deg, #4ecdc4 0%, #44a3a0 100%)',
                            padding: '25px',
                            borderRadius: '20px',
                            color: 'white',
                            boxShadow: '0 10px 30px rgba(78, 205, 196, 0.3)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px',
                                flexWrap: 'wrap',
                                gap: '15px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px'
                                }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px'
                                    }}>
                                        👤
                                    </div>
                                    <div>
                                        <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '700' }}>
                                            {memberStats.member.email?.split('@')[0]?.replace(/\./g, ' ') || `Member ${memberStats.member.id}`}
                                        </h2>
                                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                            {memberStats.member.email}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={resetFilters}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'rgba(255,255,255,0.9)',
                                        color: '#4ecdc4',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'white';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Back to All Projects
                                </button>
                            </div>

                            {/* Member KPI Cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '15px',
                                marginBottom: '25px'
                            }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                                        {memberStats.totalProjects}
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Active Projects</div>
                                </div>
                                <div style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                                        {memberStats.totalTasks}
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Assigned Tasks</div>
                                </div>
                                <div style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                                        {memberStats.completedTasks}
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Completed Tasks</div>
                                </div>
                                <div style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                                        {memberStats.overallCompletionRate}%
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Completion Rate</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Projects KPI Section */}
                    <div style={{
                        gridColumn: '1 / -1',
                        background: 'white',
                        padding: '25px',
                        borderRadius: '20px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '25px',
                            flexWrap: 'wrap',
                            gap: '15px'
                        }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: '24px',
                                color: '#2c3e50',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span>🎯</span>
                                {showMemberStats ? 'Assigned Projects Performance' : 'Project Performance KPIs'}
                            </h2>

                            <div style={{ fontSize: '14px', color: '#666' }}>
                                {filteredProjectsKPI.length} project{filteredProjectsKPI.length !== 1 ? 's' : ''} shown
                            </div>
                        </div>

                        {filteredProjectsKPI.length === 0 ? (
                            <EmptyState
                                icon={selectedMember !== 'all' ? "👤" : "📊"}
                                title={selectedMember !== 'all' ? "No Projects Assigned" : "No Projects Yet"}
                                message={selectedMember !== 'all' ?
                                    "This member doesn't have any tasks assigned across projects" :
                                    "Create your first project to see statistics"}
                            />
                        ) : viewMode === 'grid' ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                gap: '20px'
                            }}>
                                {filteredProjectsKPI.map(project => {
                                    const avgTasksPerDay = calculateAvgTasksPerDay(project.totalTasks, project.daysElapsed);
                                    return (
                                        <ProjectKPICard
                                            key={project.projectId}
                                            project={project}
                                            avgTasksPerDay={avgTasksPerDay}
                                            isFilteredView={selectedMember !== 'all'}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px',
                                maxWidth: '100%'
                            }}>
                                {filteredProjectsKPI.map(project => {
                                    const avgTasksPerDay = calculateAvgTasksPerDay(project.totalTasks, project.daysElapsed);
                                    return (
                                        <ProjectKPIList
                                            key={project.projectId}
                                            project={project}
                                            avgTasksPerDay={avgTasksPerDay}
                                            isFilteredView={selectedMember !== 'all'}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Comparison Chart */}
                    {filteredProjectsKPI.length > 0 && (
                        <div style={{
                            gridColumn: '1 / -1',
                            background: 'white',
                            padding: '25px',
                            borderRadius: '20px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                            width: '100%'
                        }}>
                            <h2 style={{
                                margin: '0 0 25px 0',
                                fontSize: '24px',
                                color: '#2c3e50',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span>📊</span>
                                {showMemberStats ? 'Assigned Tasks Distribution' : 'Projects Comparison'}
                            </h2>
                            <div style={{ width: '100%', height: '400px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filteredProjectsKPI}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="projectName"
                                            angle={-45}
                                            textAnchor="end"
                                            height={100}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <YAxis />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                border: 'none'
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="totalTasks" name="Total Tasks" fill="#667eea" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="doneTasks" name="Completed" fill="#4ecdc4" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="inProgressTasks" name="In Progress" fill="#ffd93d" radius={[8, 8, 0, 0]} />
                                        {showMemberStats && (
                                            <Bar dataKey="todoTasks" name="To Do" fill="#ff6b6b" radius={[8, 8, 0, 0]} />
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Show all projects overview when no project is selected
    if (loading) {
        return <LoadingSpinner message="Loading statistics..." />;
    }

    return (
        <div style={{
            padding: '30px',
            width: '100%',
            maxWidth: 'none',
            margin: '0',
            background: '#f5f7fa',
            minHeight: '100vh'
        }}>
            {/* Header - Full Width */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '40px',
                borderRadius: '20px',
                color: 'white',
                marginBottom: '30px',
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
                width: '100%'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '20px',
                    maxWidth: '100%'
                }}>
                    <div style={{ flex: 2, minWidth: '300px' }}>
                        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '700' }}>
                            📊 Projects KPI Dashboard
                        </h1>
                        <p style={{ margin: 0, fontSize: '16px', opacity: 0.95, marginBottom: '20px' }}>
                            Comprehensive statistics across all your projects
                        </p>
                        {user.role === 'ADMIN' && (
                            <div>
                                {/* Member Filter */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    padding: '15px',
                                    borderRadius: '12px',
                                    maxWidth: '500px'
                                }}>
                                    <div style={{
                                        fontSize: '14px',
                                        marginBottom: '10px',
                                        fontWeight: '500'
                                    }}>
                                        👥 Filter by Team Member:
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '10px',
                                        alignItems: 'center',
                                        flexWrap: 'wrap'
                                    }}>
                                        <select
                                            value={selectedMember}
                                            onChange={(e) => handleMemberFilterChange(e.target.value)}
                                            style={{
                                                flex: 1,
                                                minWidth: '250px',
                                                padding: '10px 15px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: 'white',
                                                color: '#333',
                                                fontSize: '14px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="all">👥 All Members (All Projects)</option>
                                            {members.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    👤 {member.email?.split('@')[0]?.replace(/\./g, ' ') || `Member ${member.id}`}
                                                </option>
                                            ))}
                                        </select>

                                        {selectedMember !== 'all' && (
                                            <button
                                                onClick={resetFilters}
                                                style={{
                                                    padding: '10px 20px',
                                                    background: 'rgba(255,255,255,0.9)',
                                                    color: '#667eea',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    transition: 'all 0.3s ease',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'white';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                Reset Filter
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* View Mode Buttons */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        background: 'rgba(255,255,255,0.2)',
                        padding: '15px',
                        borderRadius: '12px',
                        minWidth: '200px'
                    }}>
                        <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>
                            View Mode:
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: viewMode === 'grid' ? 'white' : 'transparent',
                                    color: viewMode === 'grid' ? '#667eea' : 'white',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    transition: 'all 0.3s ease',
                                    flex: 1
                                }}>
                                🔲 Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: viewMode === 'list' ? 'white' : 'transparent',
                                    color: viewMode === 'list' ? '#667eea' : 'white',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    transition: 'all 0.3s ease',
                                    flex: 1
                                }}>
                                📋 List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Full Width Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '25px',
                marginBottom: '30px',
                width: '100%'
            }}>
                {/* Summary Cards - Full Width */}
                <div style={{
                    gridColumn: '1 / -1',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px'
                }}>
                    <SummaryCard
                        icon="📁"
                        title="Total Projects"
                        value={filteredProjectsKPI.length}
                        color="#667eea"
                        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    />
                    <SummaryCard
                        icon="📝"
                        title="Total Tasks"
                        value={allProjectsStats?.totalTasks || 0}
                        color="#4ecdc4"
                        gradient="linear-gradient(135deg, #4ecdc4 0%, #44a3a0 100%)"
                    />
                    <SummaryCard
                        icon="✅"
                        title="Completed Tasks"
                        value={allProjectsStats?.completedTasks || 0}
                        color="#a8e6cf"
                        gradient="linear-gradient(135deg, #a8e6cf 0%, #88d8b0 100%)"
                    />
                    <SummaryCard
                        icon="📈"
                        title="Overall Completion"
                        value={`${allProjectsStats?.completionRate || 0}%`}
                        color="#ffd93d"
                        gradient="linear-gradient(135deg, #ffd93d 0%, #ffb703 100%)"
                    />
                </div>

                {/* Member Statistics - Full Width when shown */}
                {showMemberStats && memberStats && (
                    <div style={{
                        gridColumn: '1 / -1',
                        background: 'linear-gradient(135deg, #4ecdc4 0%, #44a3a0 100%)',
                        padding: '25px',
                        borderRadius: '20px',
                        color: 'white',
                        boxShadow: '0 10px 30px rgba(78, 205, 196, 0.3)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px',
                            flexWrap: 'wrap',
                            gap: '15px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px'
                            }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px'
                                }}>
                                    👤
                                </div>
                                <div>
                                    <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '700' }}>
                                        {memberStats.member.email?.split('@')[0]?.replace(/\./g, ' ') || `Member ${memberStats.member.id}`}
                                    </h2>
                                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                        {memberStats.member.email}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={resetFilters}
                                style={{
                                    padding: '10px 20px',
                                    background: 'rgba(255,255,255,0.9)',
                                    color: '#4ecdc4',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                Back to All Projects
                            </button>
                        </div>

                        {/* Member KPI Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '15px',
                            marginBottom: '25px'
                        }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.15)',
                                padding: '15px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                                    {memberStats.totalProjects}
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}>Active Projects</div>
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.15)',
                                padding: '15px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                                    {memberStats.totalTasks}
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}>Assigned Tasks</div>
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.15)',
                                padding: '15px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                                    {memberStats.completedTasks}
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}>Completed Tasks</div>
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.15)',
                                padding: '15px',
                                borderRadius: '10px',
                                textAlign: 'center',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                                    {memberStats.overallCompletionRate}%
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.9 }}>Completion Rate</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Projects KPI Section */}
                <div style={{
                    gridColumn: '1 / -1',
                    background: 'white',
                    padding: '25px',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '25px',
                        flexWrap: 'wrap',
                        gap: '15px'
                    }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '24px',
                            color: '#2c3e50',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span>🎯</span>
                            {showMemberStats ? 'Assigned Projects Performance' : 'Project Performance KPIs'}
                        </h2>

                        <div style={{ fontSize: '14px', color: '#666' }}>
                            {filteredProjectsKPI.length} project{filteredProjectsKPI.length !== 1 ? 's' : ''} shown
                        </div>
                    </div>

                    {filteredProjectsKPI.length === 0 ? (
                        <EmptyState
                            icon={selectedMember !== 'all' ? "👤" : "📊"}
                            title={selectedMember !== 'all' ? "No Projects Assigned" : "No Projects Yet"}
                            message={selectedMember !== 'all' ?
                                "This member doesn't have any tasks assigned across projects" :
                                "Create your first project to see statistics"}
                        />
                    ) : viewMode === 'grid' ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                            gap: '20px'
                        }}>
                            {filteredProjectsKPI.map(project => {
                                const avgTasksPerDay = calculateAvgTasksPerDay(project.totalTasks, project.daysElapsed);
                                return (
                                    <ProjectKPICard
                                        key={project.projectId}
                                        project={project}
                                        avgTasksPerDay={avgTasksPerDay}
                                        isFilteredView={selectedMember !== 'all'}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px',
                            maxWidth: '100%'
                        }}>
                            {filteredProjectsKPI.map(project => {
                                const avgTasksPerDay = calculateAvgTasksPerDay(project.totalTasks, project.daysElapsed);
                                return (
                                    <ProjectKPIList
                                        key={project.projectId}
                                        project={project}
                                        avgTasksPerDay={avgTasksPerDay}
                                        isFilteredView={selectedMember !== 'all'}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Comparison Chart */}
                {filteredProjectsKPI.length > 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        background: 'white',
                        padding: '25px',
                        borderRadius: '20px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        width: '100%'
                    }}>
                        <h2 style={{
                            margin: '0 0 25px 0',
                            fontSize: '24px',
                            color: '#2c3e50',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span>📊</span>
                            {showMemberStats ? 'Assigned Tasks Distribution' : 'Projects Comparison'}
                        </h2>
                        <div style={{ width: '100%', height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredProjectsKPI}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="projectName"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            border: 'none'
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="totalTasks" name="Total Tasks" fill="#667eea" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="doneTasks" name="Completed" fill="#4ecdc4" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="inProgressTasks" name="In Progress" fill="#ffd93d" radius={[8, 8, 0, 0]} />
                                    {showMemberStats && (
                                        <Bar dataKey="todoTasks" name="To Do" fill="#ff6b6b" radius={[8, 8, 0, 0]} />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Timeline Evolution Chart - ADD THIS RIGHT AFTER THE COMPARISON CHART */}
                {/* In your return statement, update this line: */}
                <TimelineChart memberId={selectedMember} />

            </div>
        </div>
    );
};



// ProjectKPICard Component (Grid View)
const ProjectKPICard = ({ project, avgTasksPerDay, isFilteredView = false }) => {
    const getStatusColor = (rate) => {
        if (rate >= 70) return '#4ecdc4';
        if (rate >= 40) return '#ffd93d';
        return '#ff6b6b';
    };

    const getHealthStatus = (completion, timeline) => {
        if (completion >= timeline) return { emoji: '🟢', text: 'On Track' };
        if (completion >= timeline - 20) return { emoji: '🟡', text: 'At Risk' };
        return { emoji: '🔴', text: 'Behind' };
    };

    const health = getHealthStatus(project.completionRate, project.progressPercentage);

    return (
        <div style={{
            background: isFilteredView ? 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)' :
                'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: `2px solid ${isFilteredView ? '#4ecdc4' : '#e9ecef'}`,
            borderRadius: '16px',
            padding: '25px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
                e.currentTarget.style.borderColor = isFilteredView ? '#44a3a0' : '#667eea';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = isFilteredView ? '#4ecdc4' : '#e9ecef';
            }}>


            {/* Decorative corner */}
            <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: isFilteredView ?
                    'linear-gradient(135deg, #4ecdc422, transparent)' :
                    'linear-gradient(135deg, #667eea22, transparent)',
                borderRadius: '0 16px 0 100%'
            }} />

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '20px',
                        color: '#2c3e50',
                        fontWeight: '700'
                    }}>
                        {project.projectName}
                    </h3>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        <span>{health.emoji}</span>
                        <span style={{ fontWeight: '600' }}>{health.text}</span>
                    </div>
                </div>
                <div style={{
                    background: getStatusColor(project.completionRate),
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: '700',
                    fontSize: '16px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                }}>
                    {project.completionRate}%
                </div>
            </div>

            {/* Progress Bars */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>Task Completion</span>
                    <span>{project.doneTasks} / {project.totalTasks}</span>
                </div>
                <ProgressBar
                    percentage={project.completionRate}
                    color={getStatusColor(project.completionRate)}
                    height="12px"
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <span>Timeline Progress</span>
                    <span>{project.daysElapsed} / {project.projectDuration} days</span>
                </div>
                <ProgressBar
                    percentage={project.progressPercentage}
                    color="#667eea"
                    height="12px"
                />
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px'
            }}>
                <MiniStat icon="📝" value={project.todoTasks} label="To Do" color="#ff6b6b" />
                <MiniStat icon="⚡" value={project.inProgressTasks} label="Active" color="#ffd93d" />
                <MiniStat icon="✅" value={project.doneTasks} label="Done" color="#4ecdc4" />
            </div>

            {/* Footer */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '20px',
                borderTop: '1px solid #e9ecef',
                fontSize: '13px',
                color: '#666'
            }}>
                {!isFilteredView && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        maxWidth: '180px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            color: '#495057',
                            fontWeight: '500'
                        }}>
                            <span>👥</span>
                            <span>Team Members</span>
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            fontSize: '11px',
                            color: '#666'
                        }}>
                            {project.memberStats && project.memberStats.length > 0 ? (
                                <>
                                    {project.memberStats.slice(0, 3).map((member, index) => (
                                        <div
                                            key={member.id || index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '2px 4px',
                                                background: index % 2 === 0 ? '#f8f9fa' : 'transparent',
                                                borderRadius: '3px'
                                            }}
                                            title={member.email}
                                        >
                                            <div style={{
                                                width: '4px',
                                                height: '4px',
                                                borderRadius: '50%',
                                                background: '#4ecdc4',
                                                flexShrink: 0
                                            }} />
                                            <span style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {member.name || member.email.split('@')[0]}
                                            </span>
                                        </div>
                                    ))}

                                    {project.memberStats.length > 3 && (
                                        <div style={{
                                            fontSize: '10px',
                                            color: '#999',
                                            marginLeft: '8px',
                                            fontStyle: 'italic'
                                        }}>
                                            and {project.memberStats.length - 3} more
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{
                                    fontSize: '11px',
                                    color: '#999',
                                    fontStyle: 'italic',
                                    paddingLeft: '10px'
                                }}>
                                    No members assigned
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚡</span>
                    <span style={{ fontWeight: '600' }}>
                        {avgTasksPerDay.toFixed(1)}/day
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⏰</span>
                    <span style={{
                        fontWeight: '600',
                        color: project.daysRemaining < 30 ? '#ff6b6b' : '#4ecdc4'
                    }}>
                        {project.daysRemaining} days left
                    </span>
                </div>
            </div>
        </div>
    );
};

// ProjectKPIList Component (List View)
const ProjectKPIList = ({ project, avgTasksPerDay, isFilteredView = false }) => {
    const getStatusColor = (rate) => {
        if (rate >= 70) return '#4ecdc4';
        if (rate >= 40) return '#ffd93d';
        return '#ff6b6b';
    };

    return (
        <div style={{
            background: isFilteredView ? 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)' : 'white',
            border: `2px solid ${isFilteredView ? '#4ecdc4' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '25px',
            transition: 'all 0.3s ease',
            position: 'relative'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isFilteredView ? '#44a3a0' : '#667eea';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isFilteredView ? '#4ecdc4' : '#e9ecef';
                e.currentTarget.style.boxShadow = 'none';
            }}>
            {isFilteredView && (
                <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '15px',
                    background: '#4ecdc4',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600'
                }}>
                    👤 Member View
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: isFilteredView ? '2fr 1fr 1fr 1fr 120px' : '2fr 1fr 1fr 1fr 1fr 120px',
                gap: '20px',
                alignItems: 'center'
            }}>
                {/* Project Info */}
                <div>
                    <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '18px',
                        color: '#2c3e50',
                        fontWeight: '700'
                    }}>
                        {project.projectName}
                    </h3>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                        {isFilteredView ? (
                            `⚡ ${avgTasksPerDay.toFixed(1)} tasks/day`
                        ) : (
                            project.members && project.members.length > 0
                                ? `👥 ${project.members.map(m => m.email.split('@')[0]).join(', ')}${project.members.length > 2 ? ` +${project.members.length - 2}` : ''} • ⚡ ${avgTasksPerDay.toFixed(1)}/day`
                                : `👥 ${project.totalMembers} members • ⚡ ${avgTasksPerDay.toFixed(1)}/day`
                        )}
                    </div>
                </div>

                {/* Task Stats */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff6b6b' }}>
                        {project.todoTasks}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>To Do</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffd93d' }}>
                        {project.inProgressTasks}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>In Progress</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#4ecdc4' }}>
                        {project.doneTasks}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Completed</div>
                </div>

                {!isFilteredView && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#667eea' }}>
                            {project.totalTasks}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
                    </div>
                )}

                {/* Completion Badge */}
                <div style={{
                    background: getStatusColor(project.completionRate),
                    color: 'white',
                    padding: '12px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontWeight: '700',
                    fontSize: '18px'
                }}>
                    {project.completionRate}%
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: '20px' }}>
                <ProgressBar
                    percentage={project.completionRate}
                    color={getStatusColor(project.completionRate)}
                    height="10px"
                />
            </div>
        </div>
    );
};

// Helper Components
const KPICard = ({ icon, title, value, color, subtitle }) => {
    return (
        <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
            borderLeft: `5px solid ${color}`,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
            }}>
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '60px',
                opacity: 0.1,
                color: color
            }}>
                {icon}
            </div>
            <div style={{
                fontSize: '36px',
                marginBottom: '15px',
                color: color
            }}>
                {icon}
            </div>
            <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#2c3e50',
                marginBottom: '5px'
            }}>
                {value}
            </div>
            <div style={{
                fontSize: '14px',
                color: '#666',
                fontWeight: '500',
                marginBottom: subtitle ? '5px' : '0'
            }}>
                {title}
            </div>
            {subtitle && (
                <div style={{
                    fontSize: '12px',
                    color: '#999',
                    fontStyle: 'italic'
                }}>
                    {subtitle}
                </div>
            )}
        </div>
    );
};

const SummaryCard = ({ icon, title, value, color, gradient }) => (
    <div style={{
        background: gradient,
        color: 'white',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
    }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
        }}>
        <div style={{ fontSize: '36px', marginBottom: '15px' }}>{icon}</div>
        <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
            {value}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.95, fontWeight: '500' }}>
            {title}
        </div>
    </div>
);

const MiniStat = ({ icon, value, label, color }) => (
    <div style={{
        textAlign: 'center',
        padding: '12px',
        background: '#f8f9fa',
        borderRadius: '10px',
        transition: 'all 0.2s ease'
    }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = color + '22';
            e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8f9fa';
            e.currentTarget.style.transform = 'scale(1)';
        }}>
        <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color }}>{value}</div>
        <div style={{ fontSize: '11px', color: '#666' }}>{label}</div>
    </div>
);

const StatItem = ({ label, value }) => (
    <div style={{
        padding: '12px',
        background: '#f8f9fa',
        borderRadius: '10px',
        textAlign: 'center',
        transition: 'all 0.2s ease'
    }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e9ecef';
            e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8f9fa';
            e.currentTarget.style.transform = 'scale(1)';
        }}>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
            {label}
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
            {value}
        </div>
    </div>
);

const ProgressBar = ({ percentage, color, label, height = '8px' }) => {
    const safePercentage = Math.min(Math.max(percentage, 0), 100);

    return (
        <div style={{
            background: '#e9ecef',
            height,
            borderRadius: height,
            overflow: 'hidden',
            position: 'relative'
        }}>
            <div style={{
                background: color,
                height: '100%',
                width: `${safePercentage}%`,
                transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                borderRadius: height,
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmer 2s infinite'
                }} />
            </div>
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

const MemberCard = ({ member }) => {
    const displayName = member.name || member.email.split('@')[0].replace(/\./g, ' ');

    return (
        <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #667eea10, #764ba210)',
            borderRadius: '15px',
            border: '2px solid #667eea20',
            transition: 'all 0.3s ease'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#667eea40';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#667eea20';
            }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '20px'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '20px',
                    boxShadow: '0 4px 10px rgba(102, 126, 234, 0.3)'
                }}>
                    {displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontWeight: '600',
                        color: '#2c3e50',
                        fontSize: '16px',
                        marginBottom: '4px'
                    }}>
                        {displayName}
                    </div>
                    <div style={{
                        fontSize: '13px',
                        color: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>📋 {member.tasksAssigned} assigned</span>
                        <span>✅ {member.tasksCompleted} completed</span>
                    </div>
                </div>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '15px',
                padding: '10px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Completion Rate:</span>
                <span style={{
                    fontWeight: 'bold',
                    fontSize: '18px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    {member.completionRate}%
                </span>
            </div>

            <div style={{
                background: '#f0f0f0',
                height: '10px',
                borderRadius: '5px',
                overflow: 'hidden',
                marginBottom: '15px'
            }}>
                <div style={{
                    background: 'linear-gradient(90deg, #4ecdc4, #44a3a0)',
                    height: '100%',
                    width: `${Math.min(member.completionRate, 100)}%`,
                    transition: 'width 1s ease-out',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        animation: 'shimmer 2s infinite'
                    }} />
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#888'
            }}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
            </div>
        </div>
    );
};

const EmptyChart = ({ message }) => (
    <div style={{
        textAlign: 'center',
        padding: '60px 0',
        color: '#999',
        background: '#f8f9fa',
        borderRadius: '10px'
    }}>
        <div style={{ fontSize: '48px', marginBottom: '10px', opacity: 0.5 }}>📭</div>
        <p style={{ fontSize: '16px', margin: 0 }}>{message}</p>
    </div>
);

const LoadingSpinner = ({ message }) => (
    <div style={{
        padding: '100px 20px',
        textAlign: 'center'
    }}>
        <div style={{
            fontSize: '60px',
            marginBottom: '20px',
            animation: 'spin 1s linear infinite'
        }}>
            ⏳
        </div>
        <p style={{ fontSize: '18px', color: '#666' }}>{message}</p>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

const EmptyState = ({ icon, title, message }) => (
    <div style={{
        textAlign: 'center',
        padding: '80px 20px',
        background: '#f8f9fa',
        borderRadius: '20px',
        border: '2px dashed #dee2e6'
    }}>
        <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.7 }}>
            {icon}
        </div>
        <h2 style={{ marginBottom: '15px', color: '#2c3e50' }}>{title}</h2>
        <p style={{ color: '#666', fontSize: '16px' }}>{message}</p>
    </div>
);


export default ProjectStatistics;