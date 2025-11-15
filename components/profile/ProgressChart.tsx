
import React, { useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/theme';
import { Icon } from '../shared/Icon';

const ProgressChart: React.FC = () => {
    const { weightHistory, user } = useUser();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const styles = getStyles(isDark);

    const formatXAxis = (tickItem: string) => {
        const date = new Date(tickItem);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const formattedData = useMemo(() => {
        return weightHistory.map(entry => ({
            name: entry.date,
            weight: parseFloat(Number(entry.weight).toFixed(2)),
        })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
    }, [weightHistory]);

    const progressStats = useMemo(() => {
        if (formattedData.length < 2) return null;
        
        const firstWeight = formattedData[0].weight;
        const lastWeight = formattedData[formattedData.length - 1].weight;
        const change = lastWeight - firstWeight;
        const changePercent = ((change / firstWeight) * 100).toFixed(1);
        
        const maxWeight = Math.max(...formattedData.map(d => d.weight));
        const minWeight = Math.min(...formattedData.map(d => d.weight));
        const avgWeight = (formattedData.reduce((sum, d) => sum + d.weight, 0) / formattedData.length).toFixed(1);
        
        return {
            change,
            changePercent,
            maxWeight,
            minWeight,
            avgWeight,
            isLoss: change < 0,
            firstWeight,
            lastWeight,
        };
    }, [formattedData]);

    if (formattedData.length < 2) {
        return (
            <div style={styles.emptyContainer}>
                <div style={styles.emptyContent}>
                    <Icon name="cycle" size={48} color={isDark ? colors.gray[600] : colors.slate[300]} />
                    <p style={styles.emptyText}>Log your weight more than once to see your progress chart!</p>
                </div>
            </div>
        );
    }
    
    return (
        <div style={styles.container}>
            {progressStats && (
                <div style={styles.statsRow}>
                    <div style={styles.statBox}>
                        <div style={{
                            ...styles.changeIndicator,
                            background: progressStats.isLoss 
                                ? (user?.goal === 'weight_loss' ? colors.primary : colors.red[400])
                                : (user?.goal === 'muscle_gain' ? colors.primary : colors.accent)
                        }}>
                            <Icon 
                                name={progressStats.isLoss ? 'down' : 'up'} 
                                size={16} 
                                color={colors.light} 
                            />
                        </div>
                        <div>
                            <p style={styles.statValue}>
                                {progressStats.change > 0 ? '+' : ''}{progressStats.change.toFixed(1)} kg
                            </p>
                            <p style={styles.statLabel}>Total Change</p>
                        </div>
                    </div>
                    
                    <div style={styles.statBox}>
                        <p style={styles.statValue}>{progressStats.avgWeight} kg</p>
                        <p style={styles.statLabel}>Average</p>
                    </div>
                    
                    <div style={styles.statBox}>
                        <p style={styles.statValue}>{formattedData.length}</p>
                        <p style={styles.statLabel}>Entries</p>
                    </div>
                </div>
            )}
            
            <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={formattedData}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'} 
                            vertical={false}
                        />
                        <XAxis 
                            dataKey="name" 
                            tickFormatter={formatXAxis} 
                            tick={{ fill: isDark ? colors.gray[500] : colors.slate[500], fontSize: 11, fontWeight: '600' }}
                            axisLine={{ stroke: isDark ? colors.gray[700] : colors.slate[300] }}
                            tickLine={false}
                        />
                        <YAxis 
                            domain={['dataMin - 2', 'dataMax + 2']} 
                            tick={{ fill: isDark ? colors.gray[500] : colors.slate[500], fontSize: 11, fontWeight: '600' }}
                            axisLine={{ stroke: isDark ? colors.gray[700] : colors.slate[300] }}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                borderRadius: '12px',
                                boxShadow: isDark 
                                    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                                    : '0 4px 12px rgba(0, 0, 0, 0.1)',
                                padding: '12px',
                            }}
                            labelStyle={{ 
                                color: isDark ? colors.light : colors.dark,
                                fontWeight: '700',
                                fontSize: '13px',
                                marginBottom: '4px',
                            }}
                            itemStyle={{
                                color: colors.primary,
                                fontWeight: '600',
                                fontSize: '14px',
                            }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric' 
                            })}
                            formatter={(value: any) => [`${value} kg`, 'Weight']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="weight" 
                            stroke={colors.primary} 
                            strokeWidth={3}
                            fill="url(#weightGradient)"
                            activeDot={{ 
                                r: 6, 
                                fill: colors.primary,
                                stroke: isDark ? colors.dark : colors.light,
                                strokeWidth: 3,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
    container: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    statsRow: {
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        justifyContent: 'space-between',
    },
    statBox: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
        padding: '12px',
        background: isDark 
            ? 'rgba(255, 255, 255, 0.04)'
            : 'rgba(0, 0, 0, 0.02)',
        borderRadius: '16px',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`,
    },
    changeIndicator: {
        width: '32px',
        height: '32px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    statValue: {
        fontSize: '16px',
        fontWeight: 800 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.light : colors.dark,
        margin: 0,
        letterSpacing: '-0.3px',
    },
    statLabel: {
        fontSize: '11px',
        fontWeight: 600 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.gray[500] : colors.slate[500],
        margin: 0,
        marginTop: '2px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    chartContainer: {
        flex: 1,
        minHeight: '200px',
        width: '100%',
    },
    emptyContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
    },
    emptyContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    emptyText: {
        fontSize: '14px',
        fontWeight: 500 as React.CSSProperties['fontWeight'],
        color: isDark ? colors.gray[500] : colors.slate[500],
        textAlign: 'center',
        lineHeight: '1.5',
        maxWidth: '280px',
    },
});

export default ProgressChart;
