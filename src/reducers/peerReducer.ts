import { Reducer } from 'redux';

import { PeerState, PeerActionTypes, PeerActions, ConnectionStatus } from '../actions/peerActions';

const initialPeerState: PeerState = {
  peers: {},
};

const peerReducer: Reducer<PeerState, PeerActions> = (state = initialPeerState, action: PeerActions) => {
  const existedClient = state.peers[action.id];
  switch (action.type) {
    case PeerActionTypes.CONNECT_PEER: {
      return {
        ...state,
        peers: {
          ...state.peers,
          [action.id]: {
            id: action.id,
            color: action.color,
            status: ConnectionStatus.Connected,
          },
        },
      };
    }

    case PeerActionTypes.DISCONNECT_PEER: {
      const client = {
        ...existedClient,
        status: ConnectionStatus.Disconnected,
      };

      return {
        ...state,
        peers: {
          ...state.peers,
          [action.id]: client,
        },
      };
    }

    default:
      return state;
  }
};

export default peerReducer;
