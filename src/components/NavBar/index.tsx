import React, { memo, MouseEvent, useCallback, useState } from 'react';
import { IconButton, Link, Tooltip } from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import MenuIcon from '@material-ui/icons/Menu';
import PeerGroup from 'components/NavBar/PeerGroup';
import ShareButton from 'components/NavBar/ShareButton';
import NetworkButton from 'components/NavBar/NetworkButton';
import { useDispatch, useSelector } from 'react-redux';
import { toggleInstant, toggleTab } from 'features/navSlices';
import { ViewCompact } from '@material-ui/icons';
import { AppState } from 'app/rootReducer';
import { Theme as ThemeType } from 'features/settingSlices';
import Settings from 'components/Editor/Sidebar/Settings';
import SettingsIcon from '@material-ui/icons/Settings';
import Popover from 'components/commons/Popover';
import { setTool, ToolType } from 'features/boardSlices';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flex: 'none',
      zIndex: 1,
    },
    appBarDark: {
      backgroundColor: 'black',
      color: 'white',
      borderBottom: '1px solid #333333',
    },
    appBar: {
      backgroundColor: 'white',
      color: 'black',
      borderBottom: '1px solid #e9e9e9',
    },
    iconButtonDark: {
      marginRight: theme.spacing(2),
      color: 'white',
    },
    iconButton: {
      marginRight: theme.spacing(2),
      color: 'black',
    },
    instantIconButtonDark: {
      color: 'white',
    },
    instantIconButton: {
      color: 'black',
    },
    grow: {
      flexGrow: 1,
    },
    title: {
      fontWeight: 'bold',
      color: theme.palette.primary.main,
      marginRight: theme.spacing(1),
    },
    yorkie: {
      '& > a': {
        textDecoration: 'none',
        color: '#b5b0a1',
        fontSize: 12,
      },
    },
    items: {
      display: 'flex',
      alignItems: 'center',
      '& > *': {
        margin: theme.spacing(1),
      },
    },
  }),
);

function MenuAppBar() {
  const menu = useSelector((state: AppState) => state.settingState.menu);
  const classes = useStyles();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | undefined>();
  const handleSettingsClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      dispatch(setTool(ToolType.Settings));
      setAnchorEl(event.currentTarget);
    },
    [dispatch],
  );

  const handleSettingsClose = useCallback(() => {
    setAnchorEl(undefined);
    dispatch(setTool(ToolType.None));
  }, [dispatch]);

  return (
    <div className={classes.root}>
      <AppBar
        position="static"
        className={menu.theme === ThemeType.Dark ? classes.appBarDark : classes.appBar}
        elevation={0}
      >
        <Toolbar>
          <IconButton
            size="small"
            onClick={() => {
              dispatch(toggleTab());
            }}
            className={menu.theme === ThemeType.Dark ? classes.iconButtonDark : classes.iconButton}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            <Link href="/" underline="none">
              CodePair
            </Link>
          </Typography>
          <Typography className={classes.yorkie}>
            <a href="https://yorkie.dev" target="_blank" rel="noreferrer">
              Powered by Yorkie
            </a>
          </Typography>
          <NetworkButton />
          <div className={classes.grow} />
          <div className={classes.items}>
            <ShareButton />
            <PeerGroup />
            <Tooltip title="Settings" arrow>
              <IconButton aria-label="settings" onClick={handleSettingsClick}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Popover anchorEl={anchorEl} onClose={handleSettingsClose}>
              <Settings />
            </Popover>
          </div>
          <IconButton
            size="small"
            onClick={() => {
              dispatch(toggleInstant());
            }}
            className={menu.theme === ThemeType.Dark ? classes.instantIconButtonDark : classes.instantIconButton}
          >
            <ViewCompact />
          </IconButton>
        </Toolbar>
      </AppBar>
    </div>
  );
}

export default memo(MenuAppBar);
