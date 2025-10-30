import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  EventAvailable as EventAvailableIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarTodayIcon,
  Business as BusinessIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme as useCustomTheme } from '../context/ThemeContext';
import NotificationCenter from './NotificationCenter';

const drawerWidth = 240;

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useCustomTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  // Navigation items based on role
  const getNavItems = () => {
    const roleSpecificItems = {
      admin: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
        { text: 'Departments', icon: <BusinessIcon />, path: '/employees' },
        { text: 'Jobs', icon: <WorkIcon />, path: '/jobs' },
        { text: 'Applications', icon: <DescriptionIcon />, path: '/applications' },
        { text: 'Attendance', icon: <CalendarTodayIcon />, path: '/attendance' },
        { text: 'Payroll', icon: <AttachMoneyIcon />, path: '/payroll' },
        { text: 'Performance', icon: <AssessmentIcon />, path: '/performance' },
        { text: 'Leave', icon: <EventAvailableIcon />, path: '/leave' },
      ],
      hr: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
        { text: 'Jobs', icon: <WorkIcon />, path: '/jobs' },
        { text: 'Applications', icon: <DescriptionIcon />, path: '/applications' },
        { text: 'Attendance', icon: <CalendarTodayIcon />, path: '/attendance' },
        { text: 'Payroll', icon: <AttachMoneyIcon />, path: '/payroll' },
        { text: 'Performance', icon: <AssessmentIcon />, path: '/performance' },
        { text: 'Leave', icon: <EventAvailableIcon />, path: '/leave' },
      ],
      recruiter: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Jobs', icon: <WorkIcon />, path: '/jobs' },
        { text: 'Applications', icon: <DescriptionIcon />, path: '/applications' },
      ],
      manager: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'My Team', icon: <GroupsIcon />, path: '/employees' },
        { text: 'Attendance', icon: <CalendarTodayIcon />, path: '/attendance' },
        { text: 'Performance', icon: <AssessmentIcon />, path: '/performance' },
        { text: 'Leave Approvals', icon: <EventAvailableIcon />, path: '/leave' },
      ],
      employee: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'My Profile', icon: <PersonIcon />, path: '/profile' },
        { text: 'My Attendance', icon: <CalendarTodayIcon />, path: '/attendance' },
        { text: 'My Payroll', icon: <AttachMoneyIcon />, path: '/payroll' },
        { text: 'My Leave', icon: <EventAvailableIcon />, path: '/leave' },
        { text: 'Internal Jobs', icon: <WorkIcon />, path: '/jobs' },
        { text: 'Performance', icon: <AssessmentIcon />, path: '/performance' },
      ],
    };

    return roleSpecificItems[user?.role] || roleSpecificItems.employee;
  };

  const navItems = getNavItems();

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          HRMS
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => isMobile && setMobileOpen(false)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AI-Powered HRMS
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.email}
            </Typography>
            <IconButton onClick={toggleColorMode} color="inherit" title="Toggle Dark Mode">
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <NotificationCenter />
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={user?.email} 
                  secondary={user?.role?.toUpperCase()} 
                />
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;

