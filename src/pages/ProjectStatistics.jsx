// src/components/Dashboard/ProjectStatistics.jsx
import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';
import ApiService from '../services/api';

const ProjectStatistics = ({ selectedProject, lists, projects }) => {
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
        memberStats: [],
        totalMembers: 0,
        assignedTasks: 0,
        unassignedTasks: 0
    });
    
    const [loading, setLoading] = useState(false);
    const [allProjectsStats, setAllProjectsStats] = useState(null);

    const loadAllProjectsStatistics = async () => {
        try {
            setLoading(true);
            const data = await ApiService.getStatisticsSummary();
            console.log('📊 ALL PROJECTS STATISTICS:', data);
            setAllProjectsStats(data);
        } catch (error) {
            console.error('❌ Failed to load all projects statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProjectStatistics = async (projectId) => {
        try {
            setLoading(true);
            console.log('🔄 Loading stats for project ID:', projectId);
            
            const data = await ApiService.getProjectStatistics(projectId);
            console.log('📈 PROJECT STATISTICS DATA:', data);

            setStats({
                totalTasks: data.totalTasks || 0,
                todoTasks: data.todoTasks || 0,
                inProgressTasks: data.inProgressTasks || 0,
                doneTasks: data.doneTasks || 0,
                completionRate: data.completionRate || 0,
                avgTasksPerDay: data.avgTasksPerDay || 0,
                projectDuration: data.projectDuration || 0,
                daysRemaining: data.daysRemaining || 0,
                daysElapsed: data.daysElapsed || 0,
                progressPercentage: data.progressPercentage || 0,
                tasksDistribution: data.tasksDistribution || getDefaultTasksDistribution(),
                assignmentDistribution: data.assignmentDistribution || getDefaultAssignmentDistribution(),
                dailyTasks: data.dailyTasks || [],
                memberStats: data.memberStats || [],
                totalMembers: data.totalMembers || 0,
                assignedTasks: data.assignedTasks || 0,
                unassignedTasks: data.unassignedTasks || 0
            });

        } catch (error) {
            console.error('❌ Failed to load project statistics:', error);
            // Set default stats on error
            setStats({
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
                tasksDistribution: getDefaultTasksDistribution(),
                assignmentDistribution: getDefaultAssignmentDistribution(),
                dailyTasks: [],
                memberStats: [],
                totalMembers: 0,
                assignedTasks: 0,
                unassignedTasks: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const getDefaultTasksDistribution = () => [
        { name: 'To Do', value: 0, color: '#ff6b6b' },
        { name: 'In Progress', value: 0, color: '#ffd93d' },
        { name: 'Done', value: 0, color: '#4ecdc4' }
    ];

    const getDefaultAssignmentDistribution = () => [
        { name: 'Assigned', value: 0, color: '#667eea' },
        { name: 'Unassigned', value: 0, color: '#c7ceea' }
    ];

    const getProductivityLevel = (avgTasksPerDay) => {
        if (avgTasksPerDay > 3) return 'High';
        if (avgTasksPerDay > 1) return 'Medium';
        return 'Low';
    };

    useEffect(() => {
        console.log('🔍 ProjectStatistics Props:', {
            selectedProject,
            hasSelectedProject: !!selectedProject,
            projectId: selectedProject?.project_id,
            projectName: selectedProject?.['project-name']
        });

        if (selectedProject?.project_id) {
            console.log('🚀 Loading stats for project:', selectedProject['project-name']);
            loadProjectStatistics(selectedProject.project_id);
        } else {
            console.log('⚠️ No valid project selected, loading all projects stats');
            loadAllProjectsStatistics();
        }
    }, [selectedProject]);

    // Show all projects overview when no project is selected
    if (!selectedProject || !selectedProject.project_id) {
        return (
            <div style={{
                padding: '40px 20px',
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                {/* All Projects Overview Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '30px',
                    borderRadius: '20px',
                    color: 'white',
                    marginBottom: '30px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}>
                    <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '700' }}>
                        📊 All Projects Overview
                    </h1>
                    <p style={{ margin: 0, fontSize: '18px', opacity: 0.95 }}>
                        Total Projects: {projects.length}
                    </p>
                </div>

                {loading ? (
                    <LoadingSpinner message="Loading statistics..." />
                ) : allProjectsStats ? (
                    <div>
                        {/* All Projects KPI Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '20px',
                            marginBottom: '30px'
                        }}>
                            <KPICard
                                icon="📁"
                                title="Total Projects"
                                value={projects.length}
                                color="#667eea"
                            />
                            <KPICard
                                icon="📝"
                                title="Total Tasks"
                                value={allProjectsStats.totalTasks || 0}
                                color="#4ecdc4"
                            />
                            <KPICard
                                icon="✅"
                                title="Completed Tasks"
                                value={allProjectsStats.completedTasks || 0}
                                color="#a8e6cf"
                            />
                            <KPICard
                                icon="📈"
                                title="Overall Completion"
                                value={`${allProjectsStats.completionRate || 0}%`}
                                color="#ffd93d"
                            />
                        </div>

                        <div style={{
                            textAlign: 'center',
                            padding: '60px 40px',
                            background: 'white',
                            borderRadius: '15px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                            marginTop: '30px'
                        }}>
                            <div style={{ fontSize: '80px', marginBottom: '20px' }}>📊</div>
                            <h2 style={{ marginBottom: '15px', color: '#2c3e50' }}>
                                Select a Project for Detailed Statistics
                            </h2>
                            <p style={{ 
                                color: '#666', 
                                marginBottom: '30px',
                                fontSize: '16px',
                                maxWidth: '600px',
                                margin: '0 auto 30px auto'
                            }}>
                                Click on any project from the list to view detailed analytics, 
                                KPIs, progress tracking, and team performance metrics.
                            </p>
                            <div style={{ 
                                fontSize: '60px', 
                                opacity: 0.5,
                                animation: 'bounce 2s infinite'
                            }}>
                                👇
                            </div>
                            <style>{`
                                @keyframes bounce {
                                    0%, 100% { transform: translateY(0); }
                                    50% { transform: translateY(-10px); }
                                }
                            `}</style>
                        </div>
                    </div>
                ) : (
                    <EmptyState 
                        icon="📊"
                        title="No Statistics Available"
                        message="Select a project or create tasks to see statistics"
                    />
                )}
            </div>
        );
    }

    if (loading) {
        return <LoadingSpinner message="Loading project statistics..." />;
    }

    return (
        <div style={{
            padding: '20px',
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '30px',
                borderRadius: '20px',
                color: 'white',
                marginBottom: '30px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '700' }}>
                    📊 Project Statistics
                </h1>
                <p style={{ margin: 0, fontSize: '18px', opacity: 0.95 }}>
                    {selectedProject['project-name'] || 'Project'}
                </p>
                <div style={{
                    marginTop: '15px',
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        padding: '10px 15px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        fontSize: '14px'
                    }}>
                        📅 Start: {selectedProject['start-date'] || 'Not set'}
                    </div>
                    <div style={{
                        padding: '10px 15px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        fontSize: '14px'
                    }}>
                        🏁 End: {selectedProject['end-date'] || 'Not set'}
                    </div>
                    <div style={{
                        padding: '10px 15px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        fontSize: '14px'
                    }}>
                        👥 Members: {stats.totalMembers || 0}
                    </div>
                    {stats.daysRemaining > 0 && (
                        <div style={{
                            padding: '10px 15px',
                            background: 'rgba(255,255,255,0.25)',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            ⏰ {stats.daysRemaining} days remaining
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <KPICard
                    icon="📝"
                    title="Total Tasks"
                    value={stats.totalTasks}
                    color="#667eea"
                />
                <KPICard
                    icon="⏳"
                    title="In Progress"
                    value={stats.inProgressTasks}
                    color="#ffd93d"
                />
                <KPICard
                    icon="✅"
                    title="Completed"
                    value={stats.doneTasks}
                    color="#4ecdc4"
                />
                <KPICard
                    icon="📈"
                    title="Completion Rate"
                    value={`${stats.completionRate}%`}
                    color="#a8e6cf"
                />
                <KPICard
                    icon="👤"
                    title="Assigned Tasks"
                    value={stats.assignedTasks}
                    color="#ff8b94"
                    subtitle={`${stats.unassignedTasks} unassigned`}
                />
                <KPICard
                    icon="⚡"
                    title="Productivity"
                    value={getProductivityLevel(stats.avgTasksPerDay)}
                    color="#c7ceea"
                    subtitle={`${stats.avgTasksPerDay} tasks/day`}
                />
            </div>

            {/* Project Summary Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#2c3e50' }}>
                        📅 Timeline Summary
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <StatItem label="Project Duration" value={`${stats.projectDuration} days`} />
                        <StatItem label="Time Elapsed" value={`${stats.daysElapsed} days`} />
                        <StatItem label="Days Remaining" value={`${stats.daysRemaining} days`} />
                        <StatItem label="Progress" value={`${stats.progressPercentage}%`} />
                    </div>
                </div>
                
                <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#2c3e50' }}>
                        🎯 Task Summary
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <StatItem label="To Do" value={stats.todoTasks} />
                        <StatItem label="In Progress" value={stats.inProgressTasks} />
                        <StatItem label="Completed" value={stats.doneTasks} />
                        <StatItem label="Avg/Day" value={stats.avgTasksPerDay} />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '25px',
                marginBottom: '30px'
            }}>
                {/* Task Status Distribution - Bar Chart */}
                <div style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0',
                        fontSize: '20px',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>📊</span> Task Status Distribution
                    </h3>
                    {stats.totalTasks > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.tasksDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip 
                                    formatter={(value) => [`${value} tasks`, 'Count']}
                                    contentStyle={{ 
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Bar 
                                    dataKey="value" 
                                    radius={[8, 8, 0, 0]}
                                    barSize={60}
                                >
                                    {stats.tasksDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message="No tasks yet" />
                    )}
                </div>

                {/* Assignment Distribution - Bar Chart */}
                <div style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0',
                        fontSize: '20px',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>👤</span> Task Assignment Status
                    </h3>
                    {stats.totalTasks > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.assignmentDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip 
                                    formatter={(value) => [`${value} tasks`, 'Count']}
                                    contentStyle={{ 
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Bar 
                                    dataKey="value" 
                                    radius={[8, 8, 0, 0]}
                                    barSize={60}
                                >
                                    {stats.assignmentDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart message="No assignment data" />
                    )}
                </div>
            </div>

            {/* Daily Activity Line Chart */}
            {stats.dailyTasks && stats.dailyTasks.length > 0 && (
                <div style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                    marginBottom: '30px'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0',
                        fontSize: '20px',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>📅</span> Daily Activity (Last 30 Days)
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={stats.dailyTasks}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(date) => {
                                    const d = new Date(date);
                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                                labelFormatter={(date) => {
                                    const d = new Date(date);
                                    return d.toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                    });
                                }}
                                contentStyle={{ 
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="tasksCreated" 
                                name="Tasks Created"
                                stroke="#667eea" 
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6, strokeWidth: 2 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="tasksCompleted" 
                                name="Tasks Completed"
                                stroke="#4ecdc4" 
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6, strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Team Member Contribution */}
            {stats.memberStats && stats.memberStats.length > 0 && (
                <div style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                    marginBottom: '30px'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0',
                        fontSize: '20px',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>👥</span> Team Member Contribution ({stats.memberStats.length} members)
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px'
                    }}>
                        {stats.memberStats.map((member, index) => (
                            <MemberCard key={member.id || index} member={member} />
                        ))}
                    </div>
                </div>
            )}

            {/* Progress Bars Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '25px',
                marginBottom: '30px'
            }}>
                {/* Task Completion Progress */}
                <div style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0',
                        fontSize: '20px',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>🎯</span> Task Completion Progress
                    </h3>
                    <ProgressBar 
                        percentage={stats.completionRate}
                        color="linear-gradient(90deg, #4ecdc4, #44a3a0)"
                        label={`${stats.completionRate}% Complete`}
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '15px',
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        <span>📝 {stats.todoTasks} To Do</span>
                        <span>⚡ {stats.inProgressTasks} In Progress</span>
                        <span>✅ {stats.doneTasks} Completed</span>
                    </div>
                </div>

                {/* Time Progress */}
                <div style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
                }}>
                    <h3 style={{
                        margin: '0 0 20px 0',
                        fontSize: '20px',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>⏰</span> Timeline Progress
                    </h3>
                    <ProgressBar 
                        percentage={stats.progressPercentage}
                        color="linear-gradient(90deg, #667eea, #764ba2)"
                        label={`${stats.progressPercentage}% Time Elapsed`}
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '15px',
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        <span>📅 {stats.daysElapsed} days elapsed</span>
                        <span>⏳ {stats.daysRemaining} days remaining</span>
                        <span>📊 {stats.projectDuration} total days</span>
                    </div>
                </div>
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
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
    }}>
        <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.7 }}>
            {icon}
        </div>
        <h2 style={{ marginBottom: '15px', color: '#2c3e50' }}>{title}</h2>
        <p style={{ color: '#666', fontSize: '16px' }}>{message}</p>
    </div>
);

const ProgressBar = ({ percentage, color, label }) => {
    const safePercentage = Math.min(Math.max(percentage, 0), 100);
    
    return (
        <div style={{
            background: '#f0f0f0',
            height: '45px',
            borderRadius: '25px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                background: color,
                height: '100%',
                width: `${safePercentage}%`,
                transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: safePercentage > 20 ? 'flex-start' : 'center',
                paddingLeft: safePercentage > 20 ? '25px' : '0',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {safePercentage > 20 && label}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'shimmer 2s infinite'
                }} />
            </div>
            {safePercentage <= 20 && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontWeight: 'bold',
                    color: '#666',
                    fontSize: '14px'
                }}>
                    {label}
                </div>
            )}
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
            
            {/* Progress bar */}
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

export default ProjectStatistics;
