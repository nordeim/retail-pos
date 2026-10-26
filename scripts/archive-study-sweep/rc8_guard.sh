#!/bin/bash
# RC-8 guard: kill anything on the e2e port and VERIFY it is actually free.
# - Retries kill until the port stops accepting connections (race-proof).
# - Bind-probe uses SO_REUSEADDR so TIME_WAIT sockets do not false-positive.
# - Hard-fails (exit 1) if the port is still bound after all retries.
PORT="${1:-3100}"
ATTEMPTS=20

port_accepts() {
  # true if a TCP connect to 127.0.0.1:$PORT succeeds (a live listener)
  python3 - "$PORT" <<'PY'
import socket, sys
s = socket.socket()
s.settimeout(0.4)
try:
    s.connect(("127.0.0.1", int(sys.argv[1])))
    sys.exit(0)
except OSError:
    sys.exit(1)
finally:
    s.close()
PY
}

port_binds_reuseaddr() {
  # true if a bind with SO_REUSEADDR FAILS -> a real listener still holds it
  python3 - "$PORT" <<'PY'
import socket, sys
s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
try:
    s.bind(("0.0.0.0", int(sys.argv[1])))
    sys.exit(1)   # bind OK -> port is free
except OSError:
    sys.exit(0)   # bind refused -> someone still holds it
finally:
    s.close()
PY
}

for i in $(seq 1 $ATTEMPTS); do
  if port_accepts; then
    PIDS=$(ss -ltnpH "sport = :$PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u)
    if [ -n "$PIDS" ]; then
      kill -9 $PIDS 2>/dev/null
    else
      # bound but no PID visible (foreign owner): try fuser as fallback
      fuser -k "$PORT"/tcp 2>/dev/null
    fi
    sleep 0.5
  else
    if port_binds_reuseaddr; then
      sleep 0.5
    else
      echo "RC8: port $PORT free (verified bind+connect, attempt $i)"
      exit 0
    fi
  fi
done

echo "RC8: FAIL — port $PORT still bound after $ATTEMPTS attempts"
exit 1
