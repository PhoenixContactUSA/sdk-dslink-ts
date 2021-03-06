export class Stream {
    constructor(onStartListen, onAllCancel, onListen) {
        this._listeners = new Set();
        this._updating = false;
        this._cached = false;
        this.isClosed = false;
        this._onStartListen = onStartListen;
        this._onAllCancel = onAllCancel;
        this._onListen = onListen;
    }
    listen(listener) {
        this._listeners.add(listener);
        if (this._onStartListen && this._listeners.size === 1) {
            this._onStartListen();
        }
        if (this._onListen) {
            this._onListen(listener);
        }
        if (this._value !== undefined && !this._updating) {
            // skip extra update if it's already in updating iteration
            listener(this._value);
        }
        return new StreamSubscription(this, listener);
    }
    unlisten(listener) {
        this._listeners.delete(listener);
        if (this._onAllCancel && this._listeners.size === 0) {
            this._onAllCancel();
        }
    }
    add(val) {
        if (this.isClosed) {
            return false;
        }
        this._value = val;
        this._dispatch();
        return true;
    }
    _dispatch() {
        this._updating = true;
        for (let listener of this._listeners) {
            listener(this._value);
        }
        this._updating = false;
        if (!this._cached) {
            this._value = undefined;
        }
    }
    close() {
        if (!this.isClosed) {
            this.isClosed = true;
            this._listeners.clear();
            if (this._onClose) {
                this._onClose();
            }
        }
    }
}
export class StreamSubscription {
    constructor(stream, listener) {
        this._stream = stream;
        this._listener = listener;
    }
    close() {
        if (this._stream && this._listener) {
            this._stream.unlisten(this._listener);
            this._stream = null;
            this._listener = null;
        }
    }
}
export class Completer {
    constructor() {
        this.isCompleted = false;
        this.future = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    complete(val) {
        if (this._resolve) {
            this._resolve(val);
        }
        this.isCompleted = true;
    }
    completeError(val) {
        if (this._reject) {
            this._reject(val);
        }
    }
}
//# sourceMappingURL=async.js.map