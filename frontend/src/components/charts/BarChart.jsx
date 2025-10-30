import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';

const BarChart = ({ data, dataKeys, xAxisKey = 'name', height = 300, showLegend = true, showGrid = true, horizontal = false }) => {
  const theme = useTheme();

  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
          {horizontal ? (
            <>
              <XAxis type="number" stroke={theme.palette.text.secondary} style={{ fontSize: '0.875rem' }} />
              <YAxis dataKey={xAxisKey} type="category" stroke={theme.palette.text.secondary} style={{ fontSize: '0.875rem' }} />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisKey} stroke={theme.palette.text.secondary} style={{ fontSize: '0.875rem' }} />
              <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: '0.875rem' }} />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
            }}
          />
          {showLegend && <Legend />}
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default BarChart;

