import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import CodeIcon from '@material-ui/icons/Code';
import Tooltip from '@material-ui/core/Tooltip';
import { createStyles, makeStyles } from '@material-ui/core/styles';

import EraserIcon from 'assets/icons/Eraser';
import MouseIcon from 'assets/icons/Mouse';
import RectIcon from 'assets/icons/Rect';
import { AppState } from 'app/rootReducer';
import { Tool, setTool } from 'features/boardSlices';

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
    },
    button: {
      marginLeft: 5,
      padding: 7,
    },
    select: {
      marginLeft: 5,
      padding: 7,
      color: theme.palette.primary.main,
    },
  }),
);

export default function Sidebar() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const tool = useSelector((state: AppState) => state.boardState.tool);

  const handleSelectTool = (nextTool: Tool) => () => {
    dispatch(setTool(nextTool));
  };

  return (
    <div className={classes.root}>
      <Tooltip title="Code" arrow className={tool === Tool.None ? classes.select : classes.button}>
        <IconButton aria-label="Code" onClick={handleSelectTool(Tool.None)}>
          <CodeIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Pencel" arrow className={tool === Tool.Line ? classes.select : classes.button}>
        <IconButton aria-label="Pencel" onClick={handleSelectTool(Tool.Line)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Eraser" arrow className={tool === Tool.Eraser ? classes.select : classes.button}>
        <IconButton aria-label="eraser" onClick={handleSelectTool(Tool.Eraser)}>
          <EraserIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Selector" arrow className={tool === Tool.Selector ? classes.select : classes.button}>
        <IconButton aria-label="selector" onClick={handleSelectTool(Tool.Selector)}>
          <MouseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Rect" arrow className={tool === Tool.Rect ? classes.select : classes.button}>
        <IconButton aria-label="rect" onClick={handleSelectTool(Tool.Rect)}>
          <RectIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
}
