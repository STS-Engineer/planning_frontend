import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import ApiService from '../services/api';

const ProjectStatistics = ({ selectedProject, projects = [] }) => {
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
    const [allProjects, setAllProjects] = useState([]);
    const [totalProjects, setTotalProjects] = useState(0);
    const [summary, setSummary] = useState({});
    const [error, setError] = useState(null);

    const getDefaultTasksDistribution = (todo = 0, inProgress = 0, done = 0) => [
        { name: 'To Do', value: todo, color: '#ff6b6b' },
        { name: 'In Progress', value: inProgress, color: '#ffd93d' },
        { name: 'Done', value: done, color: '#4ecdc4' }
    ];

    const getDefaultAssignmentDistribution = (assigned = 0, unassigned = 0) => [
        { name: 'Assigned', value: assigned, color: '#667eea' },
        { name: 'Unassigned', value: unassigned, color: '#c7ceea' }
    ];

    const getProductivityLevel = (avgTasksPerDay) => {
        if (avgTasksPerDay > 3) return 'High';
        if (avgTasksPerDay > 1) return 'Medium';
        return 'Low';
    };

    const calculateAvgTasksPerDay = (totalTasks, daysElapsed) => {
        if (!daysElapsed || daysElapsed === 0) return 0;
        return Number((totalTasks / daysElapsed).toFixed(1));
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

            // If "all" is selected, reset to show all projects
            if (memberId === 'all') {
                setFilteredProjectsKPI(projectsKPI);
                setShowMemberStats(false);
                setSelectedMember('all');
                return;
            }

            // Get member details
            const member = members.find(m => m.id == memberId || m.user_id == memberId);
            if (!member) {
                console.error('❌ Member not found:', memberId);
                return;
            }

            console.log('👤 Found member:', member);

            // Get projects where this member is assigned
            const memberProjects = [];
            const memberTaskStats = [];

            // Analyze each project for member's contributions
            for (const project of projectsKPI) {
                try {
                    // Get tasks for this project
                    const tasksResponse = await ApiService.getTasks(project.projectId);
                    const tasks = Array.isArray(tasksResponse) ? tasksResponse : [];

                    // Filter tasks assigned to this member
                    const memberTasks = tasks.filter(task => {
                        if (task.assignee_id == memberId) return true;
                        if (task.assignee && task.assignee.id == memberId) return true;
                        return false;
                    });

                    console.log(`📝 Project ${project.projectName}: ${memberTasks.length} tasks for member`);

                    if (memberTasks.length > 0) {
                        // Calculate member's stats for this project
                        const totalTasks = memberTasks.length;
                        const todoTasks = memberTasks.filter(t => t.status === 'todo').length;
                        const inProgressTasks = memberTasks.filter(t => t.status === 'in_progress').length;
                        const doneTasks = memberTasks.filter(t => t.status === 'done').length;
                        const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                        // Create project view for this member
                        const memberProjectView = {
                            ...project,
                            totalTasks,
                            todoTasks,
                            inProgressTasks,
                            doneTasks,
                            completionRate,
                            // These metrics now represent only the member's tasks
                            assignedTasks: totalTasks,
                            unassignedTasks: 0
                        };

                        memberProjects.push(memberProjectView);

                        // Add to member task stats
                        memberTaskStats.push({
                            projectId: project.projectId,
                            projectName: project.projectName,
                            tasks: memberTasks,
                            totalTasks,
                            completedTasks: doneTasks,
                            completionRate
                        });
                    }
                } catch (error) {
                    console.error(`❌ Error analyzing project ${project.projectId} for member:`, error);
                }
            }

            // Calculate overall member statistics
            const totalMemberTasks = memberTaskStats.reduce((sum, stat) => sum + stat.totalTasks, 0);
            const totalCompletedTasks = memberTaskStats.reduce((sum, stat) => sum + stat.completedTasks, 0);
            const overallCompletionRate = totalMemberTasks > 0
                ? Math.round((totalCompletedTasks / totalMemberTasks) * 100)
                : 0;

            // Calculate average tasks per day
            const avgTasksPerDay = memberTaskStats.length > 0
                ? Number((totalMemberTasks / 30).toFixed(1)) // Assuming 30 days period
                : 0;

            console.log('📊 Member statistics calculated:', {
                totalProjects: memberProjects.length,
                totalTasks: totalMemberTasks,
                completedTasks: totalCompletedTasks,
                overallCompletionRate,
                avgTasksPerDay
            });

            // Update filtered projects
            setFilteredProjectsKPI(memberProjects);

            // Set detailed member statistics
            setMemberStats({
                member,
                totalProjects: memberProjects.length,
                totalTasks: totalMemberTasks,
                completedTasks: totalCompletedTasks,
                overallCompletionRate,
                avgTasksPerDay,
                projectStats: memberTaskStats,
                productivity: getProductivityLevel(avgTasksPerDay)
            });

            setShowMemberStats(true);
            setSelectedMember(memberId);

        } catch (error) {
            console.error('❌ Failed to load member statistics:', error);
            setFilteredProjectsKPI(projectsKPI);
            setShowMemberStats(false);
            setSelectedMember('all');
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

            // Also get summary separately for global stats
            const summary = await ApiService.getStatisticsSummary();

            setAllProjectsStats(summary);
            setProjectsKPI(projects);
            setFilteredProjectsKPI(projects);
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

    // ... (keep the existing loadProjectStatistics and other methods as they are) ...

    useEffect(() => {
        console.log('🔍 ProjectStatistics Props:', {
            selectedProject,
            hasSelectedProject: !!selectedProject,
            projectId: selectedProject?.project_id,
            projectName: selectedProject?.['project-name']
        });

        if (selectedProject?.project_id) {
            console.log('🚀 Loading stats for project:', selectedProject['project-name']);
            // loadProjectStatistics(selectedProject.project_id);
        } else {
            console.log('⚠️ No valid project selected, loading all projects stats');
            loadAllProjectsStatistics();
        }
    }, [selectedProject]);

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

    // Reset filters
    const resetFilters = () => {
        setSelectedMember('all');
        setFilteredProjectsKPI(projectsKPI);
        setShowMemberStats(false);
        setMemberStats(null);
    };

    // Show individual project statistics when a project is selected
    if (selectedProject?.project_id) {
        if (loading) {
            return <LoadingSpinner message="Loading project statistics..." />;
        }

        // ... (keep existing project-specific view) ...
        return <div>Project Specific View (Not implemented in this example)</div>;
    }

    // Show all projects overview when no project is selected
    if (loading) {
        return <LoadingSpinner message="Loading statistics..." />;
    }

    return (
        <div style={{
            padding: '40px 20px',
            maxWidth: '1600px',
            margin: '0 auto',
            background: '#f5f7fa',
            minHeight: '100vh'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '40px',
                borderRadius: '20px',
                color: 'white',
                marginBottom: '40px',
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '20px'
                }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: '0 0 10px 0', fontSize: '36px', fontWeight: '700' }}>
                            📊 Projects KPI Dashboard
                        </h1>
                        <p style={{ margin: 0, fontSize: '18px', opacity: 0.95 }}>
                            Comprehensive statistics across all your projects
                        </p>

                        {/* Member Filter */}
                        <div style={{
                            marginTop: '20px',
                            background: 'rgba(255,255,255,0.2)',
                            padding: '15px',
                            borderRadius: '12px',
                            maxWidth: '400px'
                        }}>
                            <div style={{
                                fontSize: '16px',
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
                                        minWidth: '200px',
                                        padding: '12px',
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
                                            padding: '12px 20px',
                                            background: 'rgba(255,255,255,0.9)',
                                            color: '#667eea',
                                            border: 'none',
                                            borderRadius: '8px',
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
                                        Reset Filter
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        background: 'rgba(255,255,255,0.2)',
                        padding: '15px',
                        borderRadius: '12px'
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
                                    transition: 'all 0.3s ease'
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
                                    transition: 'all 0.3s ease'
                                }}>
                                📋 List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Show Member Statistics Card when a member is selected */}
            {showMemberStats && memberStats && (
                <div style={{
                    background: 'linear-gradient(135deg, #4ecdc4 0%, #44a3a0 100%)',
                    padding: '30px',
                    borderRadius: '20px',
                    marginBottom: '30px',
                    color: 'white',
                    boxShadow: '0 10px 30px rgba(78, 205, 196, 0.3)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '25px',
                        flexWrap: 'wrap',
                        gap: '20px'
                    }}>
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                marginBottom: '10px'
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px'
                                }}>
                                    👤
                                </div>
                                <div>
                                    <h2 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: '700' }}>
                                        {memberStats.member.email?.split('@')[0]?.replace(/\./g, ' ') || `Member ${memberStats.member.id}`}
                                    </h2>
                                    <div style={{ fontSize: '16px', opacity: 0.9 }}>
                                        {memberStats.member.email}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'center'
                        }}>
                            <button
                                onClick={resetFilters}
                                style={{
                                    padding: '12px 24px',
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
                                ← Back to All Projects
                            </button>
                        </div>
                    </div>

                    {/* Member KPI Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px',
                        marginBottom: '25px'
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '20px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
                                {memberStats.totalProjects}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Projects</div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '20px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
                                {memberStats.totalTasks}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Assigned Tasks</div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '20px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
                                {memberStats.completedTasks}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Completed Tasks</div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '20px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
                                {memberStats.overallCompletionRate}%
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Completion Rate</div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '20px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
                                {memberStats.avgTasksPerDay.toFixed(1)}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Avg Tasks/Day</div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '20px',
                            borderRadius: '12px',
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
                                {memberStats.productivity}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Productivity Level</div>
                        </div>
                    </div>

                    {/* Member's Project Breakdown */}
                    {memberStats.projectStats && memberStats.projectStats.length > 0 && (
                        <div>
                            <h3 style={{
                                fontSize: '20px',
                                margin: '0 0 20px 0',
                                fontWeight: '600',
                                opacity: 0.9
                            }}>
                                📋 Project-wise Task Breakdown
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '15px'
                            }}>
                                {memberStats.projectStats.map((projectStat, index) => (
                                    <div key={index} style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '15px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.2)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '10px'
                                        }}>
                                            <div style={{
                                                fontWeight: '600',
                                                fontSize: '16px'
                                            }}>
                                                {projectStat.projectName}
                                            </div>
                                            <div style={{
                                                background: projectStat.completionRate >= 70 ? 'rgba(255,255,255,0.2)' :
                                                    projectStat.completionRate >= 40 ? 'rgba(255,215,61,0.2)' :
                                                        'rgba(255,107,107,0.2)',
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}>
                                                {projectStat.completionRate}%
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '10px' }}>
                                            {projectStat.totalTasks} tasks • {projectStat.completedTasks} completed
                                        </div>
                                        <div style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            height: '8px',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                background: 'white',
                                                height: '100%',
                                                width: `${Math.min(projectStat.completionRate, 100)}%`,
                                                transition: 'width 1s ease-out'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Global Summary Cards */}
            {allProjectsStats && !showMemberStats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px'
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
                        value={allProjectsStats.totalTasks || 0}
                        color="#4ecdc4"
                        gradient="linear-gradient(135deg, #4ecdc4 0%, #44a3a0 100%)"
                    />
                    <SummaryCard
                        icon="✅"
                        title="Completed Tasks"
                        value={allProjectsStats.completedTasks || 0}
                        color="#a8e6cf"
                        gradient="linear-gradient(135deg, #a8e6cf 0%, #88d8b0 100%)"
                    />
                    <SummaryCard
                        icon="📈"
                        title="Overall Completion"
                        value={`${allProjectsStats.completionRate || 0}%`}
                        color="#ffd93d"
                        gradient="linear-gradient(135deg, #ffd93d 0%, #ffb703 100%)"
                    />
                </div>
            )}

            {/* Filter Info Banner */}
            {selectedMember !== 'all' && showMemberStats && (
                <div style={{
                    background: 'linear-gradient(135deg, #ffd93d 0%, #ffb703 100%)',
                    padding: '15px 25px',
                    borderRadius: '12px',
                    marginBottom: '25px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    color: '#333',
                    fontWeight: '500'
                }}>
                    <div style={{ fontSize: '24px' }}>👤</div>
                    <div style={{ flex: 1 }}>
                        <strong>Viewing tasks assigned to: </strong>
                        {memberStats?.member?.email?.split('@')[0]?.replace(/\./g, ' ') || `Member ${memberStats?.member?.id}`}
                        <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>
                            Showing {filteredProjectsKPI.length} project{filteredProjectsKPI.length !== 1 ? 's' : ''} • {memberStats?.totalTasks || 0} total tasks
                        </div>
                    </div>
                </div>
            )}

            {/* Projects KPI Section */}
            <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                marginBottom: '30px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '30px',
                    flexWrap: 'wrap',
                    gap: '20px'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '28px',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span>🎯</span>
                        {showMemberStats ? 'Assigned Projects Performance' : 'Project Performance KPIs'}
                    </h2>

                    <div style={{ fontSize: '16px', color: '#666' }}>
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
                        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                        gap: '25px'
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                    background: 'white',
                    padding: '30px',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    <h2 style={{
                        margin: '0 0 30px 0',
                        fontSize: '28px',
                        color: '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span>📊</span>
                        {showMemberStats ? 'Assigned Tasks Distribution' : 'Projects Comparison'}
                    </h2>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={filteredProjectsKPI}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="projectName"
                                angle={-45}
                                textAnchor="end"
                                height={120}
                                tick={{ fontSize: 12 }}
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
            )}
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
            {/* Filter indicator */}
            {isFilteredView && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#4ecdc4',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    zIndex: 2
                }}>
                    👤 Filtered
                </div>
            )}

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>👥</span>
                        <span>{project.totalMembers} members</span>
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
                            `👥 ${project.totalMembers} members • ⚡ ${avgTasksPerDay.toFixed(1)}/day`
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
