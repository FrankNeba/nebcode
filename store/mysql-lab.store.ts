import { create } from 'zustand';
import { getWsUrl } from '@/lib/api';
import { mysqlLabService } from '@/services';
import { useDeviceOtpStore } from '@/store/device-otp.store';
import toast from 'react-hot-toast';

export interface TerminalLine {
  text: string;
  type: 'output' | 'input' | 'error' | 'system';
}

interface MySQLLabState {
  ws: WebSocket | null;
  connected: boolean;
  connecting: boolean;
  lines: TerminalLine[];
  history: string[];
  histIdx: number;
  input: string;
  setInput: (val: string) => void;
  setHistIdx: (idx: number) => void;
  addLine: (text: string, type?: TerminalLine['type']) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendCommand: (cmd: string) => void;
  handleArrowUp: () => void;
  handleArrowDown: () => void;
  clearLines: () => void;
}

export const useMySQLLabStore = create<MySQLLabState>((set, get) => ({
  ws: null,
  connected: false,
  connecting: false,
  lines: [],
  history: [],
  histIdx: -1,
  input: '',
  setInput: (input) => set({ input }),
  setHistIdx: (histIdx) => set({ histIdx }),
  addLine: (text, type = 'output') => {
    set((state) => ({ lines: [...state.lines, { text, type }] }));
  },
  clearLines: () => set({ lines: [] }),
  connect: async () => {
    const { ws, connecting, connected } = get();
    if (ws && ws.readyState === WebSocket.OPEN) return;
    if (connecting) return;

    set({ connecting: true });
    try {
      const { data } = await mysqlLabService.startSession();
      if (data && data.otp_required) {
        set({ connecting: false });
        useDeviceOtpStore.getState().openModal(
          (typeof window !== 'undefined' ? localStorage.getItem('nebcode_device_id') : '') || '',
          () => { get().connect(); }
        );
        return;
      }
    } catch (e) {
      toast.error('Failed to initialize MySQL session');
      set({ connecting: false, connected: false });
      return;
    }

    const socketUrl = getWsUrl('/ws/mysql-lab/');
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      set({ connected: true, connecting: false, ws: socket });
    };

    socket.onclose = () => {
      set({ connected: false, connecting: false, ws: null });
      get().addLine('Connection closed.', 'system');
    };

    socket.onerror = () => {
      set({ connected: false, connecting: false, ws: null });
      get().addLine('Connection error.', 'error');
    };

    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'output' || msg.type === 'error') {
          const text = msg.data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          get().addLine(text, msg.type === 'error' ? 'error' : 'output');
        }
      } catch {
        get().addLine(e.data, 'output');
      }
    };
  },
  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
    }
    set({ ws: null, connected: false, connecting: false, lines: [] });
  },
  sendCommand: (cmd: string) => {
    const { ws, connected, history } = get();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error('Terminal not connected.');
      return;
    }
    ws.send(JSON.stringify({ input: cmd }));
    let nextHistory = history;
    if (cmd.trim()) {
      nextHistory = [cmd, ...history.slice(0, 49)];
    }
    set({
      history: nextHistory,
      histIdx: -1,
      input: '',
    });
  },
  handleArrowUp: () => {
    const { histIdx, history } = get();
    const nextIdx = Math.min(histIdx + 1, history.length - 1);
    if (nextIdx >= 0 && nextIdx < history.length) {
      set({ histIdx: nextIdx, input: history[nextIdx] });
    }
  },
  handleArrowDown: () => {
    const { histIdx, history } = get();
    const nextIdx = Math.max(histIdx - 1, -1);
    set({ histIdx: nextIdx, input: nextIdx === -1 ? '' : history[nextIdx] });
  },
}));
