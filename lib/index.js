"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/universalify/index.js
var require_universalify = __commonJS({
  "node_modules/universalify/index.js"(exports) {
    "use strict";
    exports.fromCallback = function(fn) {
      return Object.defineProperty(function(...args) {
        if (typeof args[args.length - 1] === "function")
          fn.apply(this, args);
        else {
          return new Promise((resolve2, reject) => {
            fn.call(
              this,
              ...args,
              (err, res) => err != null ? reject(err) : resolve2(res)
            );
          });
        }
      }, "name", { value: fn.name });
    };
    exports.fromPromise = function(fn) {
      return Object.defineProperty(function(...args) {
        const cb = args[args.length - 1];
        if (typeof cb !== "function")
          return fn.apply(this, args);
        else
          fn.apply(this, args.slice(0, -1)).then((r) => cb(null, r), cb);
      }, "name", { value: fn.name });
    };
  }
});

// node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS({
  "node_modules/graceful-fs/polyfills.js"(exports, module2) {
    var constants = require("constants");
    var origCwd = process.cwd;
    var cwd = null;
    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
    process.cwd = function() {
      if (!cwd)
        cwd = origCwd.call(process);
      return cwd;
    };
    try {
      process.cwd();
    } catch (er) {
    }
    if (typeof process.chdir === "function") {
      chdir = process.chdir;
      process.chdir = function(d) {
        cwd = null;
        chdir.call(process, d);
      };
      if (Object.setPrototypeOf)
        Object.setPrototypeOf(process.chdir, chdir);
    }
    var chdir;
    module2.exports = patch;
    function patch(fs) {
      if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
        patchLchmod(fs);
      }
      if (!fs.lutimes) {
        patchLutimes(fs);
      }
      fs.chown = chownFix(fs.chown);
      fs.fchown = chownFix(fs.fchown);
      fs.lchown = chownFix(fs.lchown);
      fs.chmod = chmodFix(fs.chmod);
      fs.fchmod = chmodFix(fs.fchmod);
      fs.lchmod = chmodFix(fs.lchmod);
      fs.chownSync = chownFixSync(fs.chownSync);
      fs.fchownSync = chownFixSync(fs.fchownSync);
      fs.lchownSync = chownFixSync(fs.lchownSync);
      fs.chmodSync = chmodFixSync(fs.chmodSync);
      fs.fchmodSync = chmodFixSync(fs.fchmodSync);
      fs.lchmodSync = chmodFixSync(fs.lchmodSync);
      fs.stat = statFix(fs.stat);
      fs.fstat = statFix(fs.fstat);
      fs.lstat = statFix(fs.lstat);
      fs.statSync = statFixSync(fs.statSync);
      fs.fstatSync = statFixSync(fs.fstatSync);
      fs.lstatSync = statFixSync(fs.lstatSync);
      if (fs.chmod && !fs.lchmod) {
        fs.lchmod = function(path2, mode, cb) {
          if (cb)
            process.nextTick(cb);
        };
        fs.lchmodSync = function() {
        };
      }
      if (fs.chown && !fs.lchown) {
        fs.lchown = function(path2, uid, gid, cb) {
          if (cb)
            process.nextTick(cb);
        };
        fs.lchownSync = function() {
        };
      }
      if (platform === "win32") {
        fs.rename = typeof fs.rename !== "function" ? fs.rename : function(fs$rename) {
          function rename(from, to, cb) {
            var start = Date.now();
            var backoff = 0;
            fs$rename(from, to, function CB(er) {
              if (er && (er.code === "EACCES" || er.code === "EPERM") && Date.now() - start < 6e4) {
                setTimeout(function() {
                  fs.stat(to, function(stater, st) {
                    if (stater && stater.code === "ENOENT")
                      fs$rename(from, to, CB);
                    else
                      cb(er);
                  });
                }, backoff);
                if (backoff < 100)
                  backoff += 10;
                return;
              }
              if (cb)
                cb(er);
            });
          }
          if (Object.setPrototypeOf)
            Object.setPrototypeOf(rename, fs$rename);
          return rename;
        }(fs.rename);
      }
      fs.read = typeof fs.read !== "function" ? fs.read : function(fs$read) {
        function read(fd, buffer, offset, length, position, callback_) {
          var callback;
          if (callback_ && typeof callback_ === "function") {
            var eagCounter = 0;
            callback = function(er, _, __) {
              if (er && er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                return fs$read.call(fs, fd, buffer, offset, length, position, callback);
              }
              callback_.apply(this, arguments);
            };
          }
          return fs$read.call(fs, fd, buffer, offset, length, position, callback);
        }
        if (Object.setPrototypeOf)
          Object.setPrototypeOf(read, fs$read);
        return read;
      }(fs.read);
      fs.readSync = typeof fs.readSync !== "function" ? fs.readSync : function(fs$readSync) {
        return function(fd, buffer, offset, length, position) {
          var eagCounter = 0;
          while (true) {
            try {
              return fs$readSync.call(fs, fd, buffer, offset, length, position);
            } catch (er) {
              if (er.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                continue;
              }
              throw er;
            }
          }
        };
      }(fs.readSync);
      function patchLchmod(fs2) {
        fs2.lchmod = function(path2, mode, callback) {
          fs2.open(
            path2,
            constants.O_WRONLY | constants.O_SYMLINK,
            mode,
            function(err, fd) {
              if (err) {
                if (callback)
                  callback(err);
                return;
              }
              fs2.fchmod(fd, mode, function(err2) {
                fs2.close(fd, function(err22) {
                  if (callback)
                    callback(err2 || err22);
                });
              });
            }
          );
        };
        fs2.lchmodSync = function(path2, mode) {
          var fd = fs2.openSync(path2, constants.O_WRONLY | constants.O_SYMLINK, mode);
          var threw = true;
          var ret;
          try {
            ret = fs2.fchmodSync(fd, mode);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs2.closeSync(fd);
              } catch (er) {
              }
            } else {
              fs2.closeSync(fd);
            }
          }
          return ret;
        };
      }
      function patchLutimes(fs2) {
        if (constants.hasOwnProperty("O_SYMLINK") && fs2.futimes) {
          fs2.lutimes = function(path2, at, mt, cb) {
            fs2.open(path2, constants.O_SYMLINK, function(er, fd) {
              if (er) {
                if (cb)
                  cb(er);
                return;
              }
              fs2.futimes(fd, at, mt, function(er2) {
                fs2.close(fd, function(er22) {
                  if (cb)
                    cb(er2 || er22);
                });
              });
            });
          };
          fs2.lutimesSync = function(path2, at, mt) {
            var fd = fs2.openSync(path2, constants.O_SYMLINK);
            var ret;
            var threw = true;
            try {
              ret = fs2.futimesSync(fd, at, mt);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs2.closeSync(fd);
                } catch (er) {
                }
              } else {
                fs2.closeSync(fd);
              }
            }
            return ret;
          };
        } else if (fs2.futimes) {
          fs2.lutimes = function(_a, _b, _c, cb) {
            if (cb)
              process.nextTick(cb);
          };
          fs2.lutimesSync = function() {
          };
        }
      }
      function chmodFix(orig) {
        if (!orig)
          return orig;
        return function(target, mode, cb) {
          return orig.call(fs, target, mode, function(er) {
            if (chownErOk(er))
              er = null;
            if (cb)
              cb.apply(this, arguments);
          });
        };
      }
      function chmodFixSync(orig) {
        if (!orig)
          return orig;
        return function(target, mode) {
          try {
            return orig.call(fs, target, mode);
          } catch (er) {
            if (!chownErOk(er))
              throw er;
          }
        };
      }
      function chownFix(orig) {
        if (!orig)
          return orig;
        return function(target, uid, gid, cb) {
          return orig.call(fs, target, uid, gid, function(er) {
            if (chownErOk(er))
              er = null;
            if (cb)
              cb.apply(this, arguments);
          });
        };
      }
      function chownFixSync(orig) {
        if (!orig)
          return orig;
        return function(target, uid, gid) {
          try {
            return orig.call(fs, target, uid, gid);
          } catch (er) {
            if (!chownErOk(er))
              throw er;
          }
        };
      }
      function statFix(orig) {
        if (!orig)
          return orig;
        return function(target, options, cb) {
          if (typeof options === "function") {
            cb = options;
            options = null;
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0)
                stats.uid += 4294967296;
              if (stats.gid < 0)
                stats.gid += 4294967296;
            }
            if (cb)
              cb.apply(this, arguments);
          }
          return options ? orig.call(fs, target, options, callback) : orig.call(fs, target, callback);
        };
      }
      function statFixSync(orig) {
        if (!orig)
          return orig;
        return function(target, options) {
          var stats = options ? orig.call(fs, target, options) : orig.call(fs, target);
          if (stats) {
            if (stats.uid < 0)
              stats.uid += 4294967296;
            if (stats.gid < 0)
              stats.gid += 4294967296;
          }
          return stats;
        };
      }
      function chownErOk(er) {
        if (!er)
          return true;
        if (er.code === "ENOSYS")
          return true;
        var nonroot = !process.getuid || process.getuid() !== 0;
        if (nonroot) {
          if (er.code === "EINVAL" || er.code === "EPERM")
            return true;
        }
        return false;
      }
    }
  }
});

// node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS({
  "node_modules/graceful-fs/legacy-streams.js"(exports, module2) {
    var Stream = require("stream").Stream;
    module2.exports = legacy;
    function legacy(fs) {
      return {
        ReadStream,
        WriteStream
      };
      function ReadStream(path2, options) {
        if (!(this instanceof ReadStream))
          return new ReadStream(path2, options);
        Stream.call(this);
        var self = this;
        this.path = path2;
        this.fd = null;
        this.readable = true;
        this.paused = false;
        this.flags = "r";
        this.mode = 438;
        this.bufferSize = 64 * 1024;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.encoding)
          this.setEncoding(this.encoding);
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.end === void 0) {
            this.end = Infinity;
          } else if ("number" !== typeof this.end) {
            throw TypeError("end must be a Number");
          }
          if (this.start > this.end) {
            throw new Error("start must be <= end");
          }
          this.pos = this.start;
        }
        if (this.fd !== null) {
          process.nextTick(function() {
            self._read();
          });
          return;
        }
        fs.open(this.path, this.flags, this.mode, function(err, fd) {
          if (err) {
            self.emit("error", err);
            self.readable = false;
            return;
          }
          self.fd = fd;
          self.emit("open", fd);
          self._read();
        });
      }
      function WriteStream(path2, options) {
        if (!(this instanceof WriteStream))
          return new WriteStream(path2, options);
        Stream.call(this);
        this.path = path2;
        this.fd = null;
        this.writable = true;
        this.flags = "w";
        this.encoding = "binary";
        this.mode = 438;
        this.bytesWritten = 0;
        options = options || {};
        var keys = Object.keys(options);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options[key];
        }
        if (this.start !== void 0) {
          if ("number" !== typeof this.start) {
            throw TypeError("start must be a Number");
          }
          if (this.start < 0) {
            throw new Error("start must be >= zero");
          }
          this.pos = this.start;
        }
        this.busy = false;
        this._queue = [];
        if (this.fd === null) {
          this._open = fs.open;
          this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
          this.flush();
        }
      }
    }
  }
});

// node_modules/graceful-fs/clone.js
var require_clone = __commonJS({
  "node_modules/graceful-fs/clone.js"(exports, module2) {
    "use strict";
    module2.exports = clone2;
    var getPrototypeOf = Object.getPrototypeOf || function(obj) {
      return obj.__proto__;
    };
    function clone2(obj) {
      if (obj === null || typeof obj !== "object")
        return obj;
      if (obj instanceof Object)
        var copy = { __proto__: getPrototypeOf(obj) };
      else
        var copy = /* @__PURE__ */ Object.create(null);
      Object.getOwnPropertyNames(obj).forEach(function(key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
      });
      return copy;
    }
  }
});

// node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS({
  "node_modules/graceful-fs/graceful-fs.js"(exports, module2) {
    var fs = require("fs");
    var polyfills = require_polyfills();
    var legacy = require_legacy_streams();
    var clone2 = require_clone();
    var util = require("util");
    var gracefulQueue;
    var previousSymbol;
    if (typeof Symbol === "function" && typeof Symbol.for === "function") {
      gracefulQueue = Symbol.for("graceful-fs.queue");
      previousSymbol = Symbol.for("graceful-fs.previous");
    } else {
      gracefulQueue = "___graceful-fs.queue";
      previousSymbol = "___graceful-fs.previous";
    }
    function noop() {
    }
    function publishQueue(context, queue2) {
      Object.defineProperty(context, gracefulQueue, {
        get: function() {
          return queue2;
        }
      });
    }
    var debug = noop;
    if (util.debuglog)
      debug = util.debuglog("gfs4");
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
      debug = function() {
        var m = util.format.apply(util, arguments);
        m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
        console.error(m);
      };
    if (!fs[gracefulQueue]) {
      queue = global[gracefulQueue] || [];
      publishQueue(fs, queue);
      fs.close = function(fs$close) {
        function close(fd, cb) {
          return fs$close.call(fs, fd, function(err) {
            if (!err) {
              resetQueue();
            }
            if (typeof cb === "function")
              cb.apply(this, arguments);
          });
        }
        Object.defineProperty(close, previousSymbol, {
          value: fs$close
        });
        return close;
      }(fs.close);
      fs.closeSync = function(fs$closeSync) {
        function closeSync(fd) {
          fs$closeSync.apply(fs, arguments);
          resetQueue();
        }
        Object.defineProperty(closeSync, previousSymbol, {
          value: fs$closeSync
        });
        return closeSync;
      }(fs.closeSync);
      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
        process.on("exit", function() {
          debug(fs[gracefulQueue]);
          require("assert").equal(fs[gracefulQueue].length, 0);
        });
      }
    }
    var queue;
    if (!global[gracefulQueue]) {
      publishQueue(global, fs[gracefulQueue]);
    }
    module2.exports = patch(clone2(fs));
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
      module2.exports = patch(fs);
      fs.__patched = true;
    }
    function patch(fs2) {
      polyfills(fs2);
      fs2.gracefulify = patch;
      fs2.createReadStream = createReadStream;
      fs2.createWriteStream = createWriteStream;
      var fs$readFile = fs2.readFile;
      fs2.readFile = readFile;
      function readFile(path2, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$readFile(path2, options, cb);
        function go$readFile(path3, options2, cb2, startTime) {
          return fs$readFile(path3, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$readFile, [path3, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$writeFile = fs2.writeFile;
      fs2.writeFile = writeFile;
      function writeFile(path2, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$writeFile(path2, data, options, cb);
        function go$writeFile(path3, data2, options2, cb2, startTime) {
          return fs$writeFile(path3, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$writeFile, [path3, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$appendFile = fs2.appendFile;
      if (fs$appendFile)
        fs2.appendFile = appendFile;
      function appendFile(path2, data, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        return go$appendFile(path2, data, options, cb);
        function go$appendFile(path3, data2, options2, cb2, startTime) {
          return fs$appendFile(path3, data2, options2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$appendFile, [path3, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$copyFile = fs2.copyFile;
      if (fs$copyFile)
        fs2.copyFile = copyFile;
      function copyFile(src, dest, flags, cb) {
        if (typeof flags === "function") {
          cb = flags;
          flags = 0;
        }
        return go$copyFile(src, dest, flags, cb);
        function go$copyFile(src2, dest2, flags2, cb2, startTime) {
          return fs$copyFile(src2, dest2, flags2, function(err) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$readdir = fs2.readdir;
      fs2.readdir = readdir;
      var noReaddirOptionVersions = /^v[0-5]\./;
      function readdir(path2, options, cb) {
        if (typeof options === "function")
          cb = options, options = null;
        var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path3, options2, cb2, startTime) {
          return fs$readdir(path3, fs$readdirCallback(
            path3,
            options2,
            cb2,
            startTime
          ));
        } : function go$readdir2(path3, options2, cb2, startTime) {
          return fs$readdir(path3, options2, fs$readdirCallback(
            path3,
            options2,
            cb2,
            startTime
          ));
        };
        return go$readdir(path2, options, cb);
        function fs$readdirCallback(path3, options2, cb2, startTime) {
          return function(err, files) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([
                go$readdir,
                [path3, options2, cb2],
                err,
                startTime || Date.now(),
                Date.now()
              ]);
            else {
              if (files && files.sort)
                files.sort();
              if (typeof cb2 === "function")
                cb2.call(this, err, files);
            }
          };
        }
      }
      if (process.version.substr(0, 4) === "v0.8") {
        var legStreams = legacy(fs2);
        ReadStream = legStreams.ReadStream;
        WriteStream = legStreams.WriteStream;
      }
      var fs$ReadStream = fs2.ReadStream;
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype);
        ReadStream.prototype.open = ReadStream$open;
      }
      var fs$WriteStream = fs2.WriteStream;
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype);
        WriteStream.prototype.open = WriteStream$open;
      }
      Object.defineProperty(fs2, "ReadStream", {
        get: function() {
          return ReadStream;
        },
        set: function(val) {
          ReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(fs2, "WriteStream", {
        get: function() {
          return WriteStream;
        },
        set: function(val) {
          WriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileReadStream = ReadStream;
      Object.defineProperty(fs2, "FileReadStream", {
        get: function() {
          return FileReadStream;
        },
        set: function(val) {
          FileReadStream = val;
        },
        enumerable: true,
        configurable: true
      });
      var FileWriteStream = WriteStream;
      Object.defineProperty(fs2, "FileWriteStream", {
        get: function() {
          return FileWriteStream;
        },
        set: function(val) {
          FileWriteStream = val;
        },
        enumerable: true,
        configurable: true
      });
      function ReadStream(path2, options) {
        if (this instanceof ReadStream)
          return fs$ReadStream.apply(this, arguments), this;
        else
          return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
      }
      function ReadStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            if (that.autoClose)
              that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
            that.read();
          }
        });
      }
      function WriteStream(path2, options) {
        if (this instanceof WriteStream)
          return fs$WriteStream.apply(this, arguments), this;
        else
          return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
      }
      function WriteStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function(err, fd) {
          if (err) {
            that.destroy();
            that.emit("error", err);
          } else {
            that.fd = fd;
            that.emit("open", fd);
          }
        });
      }
      function createReadStream(path2, options) {
        return new fs2.ReadStream(path2, options);
      }
      function createWriteStream(path2, options) {
        return new fs2.WriteStream(path2, options);
      }
      var fs$open = fs2.open;
      fs2.open = open;
      function open(path2, flags, mode, cb) {
        if (typeof mode === "function")
          cb = mode, mode = null;
        return go$open(path2, flags, mode, cb);
        function go$open(path3, flags2, mode2, cb2, startTime) {
          return fs$open(path3, flags2, mode2, function(err, fd) {
            if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
              enqueue([go$open, [path3, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === "function")
                cb2.apply(this, arguments);
            }
          });
        }
      }
      return fs2;
    }
    function enqueue(elem) {
      debug("ENQUEUE", elem[0].name, elem[1]);
      fs[gracefulQueue].push(elem);
      retry();
    }
    var retryTimer;
    function resetQueue() {
      var now = Date.now();
      for (var i = 0; i < fs[gracefulQueue].length; ++i) {
        if (fs[gracefulQueue][i].length > 2) {
          fs[gracefulQueue][i][3] = now;
          fs[gracefulQueue][i][4] = now;
        }
      }
      retry();
    }
    function retry() {
      clearTimeout(retryTimer);
      retryTimer = void 0;
      if (fs[gracefulQueue].length === 0)
        return;
      var elem = fs[gracefulQueue].shift();
      var fn = elem[0];
      var args = elem[1];
      var err = elem[2];
      var startTime = elem[3];
      var lastTime = elem[4];
      if (startTime === void 0) {
        debug("RETRY", fn.name, args);
        fn.apply(null, args);
      } else if (Date.now() - startTime >= 6e4) {
        debug("TIMEOUT", fn.name, args);
        var cb = args.pop();
        if (typeof cb === "function")
          cb.call(null, err);
      } else {
        var sinceAttempt = Date.now() - lastTime;
        var sinceStart = Math.max(lastTime - startTime, 1);
        var desiredDelay = Math.min(sinceStart * 1.2, 100);
        if (sinceAttempt >= desiredDelay) {
          debug("RETRY", fn.name, args);
          fn.apply(null, args.concat([startTime]));
        } else {
          fs[gracefulQueue].push(elem);
        }
      }
      if (retryTimer === void 0) {
        retryTimer = setTimeout(retry, 0);
      }
    }
  }
});

// node_modules/fs-extra/lib/fs/index.js
var require_fs = __commonJS({
  "node_modules/fs-extra/lib/fs/index.js"(exports) {
    "use strict";
    var u = require_universalify().fromCallback;
    var fs = require_graceful_fs();
    var api = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "lchmod",
      "lchown",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((key) => {
      return typeof fs[key] === "function";
    });
    Object.assign(exports, fs);
    api.forEach((method) => {
      exports[method] = u(fs[method]);
    });
    exports.exists = function(filename, callback) {
      if (typeof callback === "function") {
        return fs.exists(filename, callback);
      }
      return new Promise((resolve2) => {
        return fs.exists(filename, resolve2);
      });
    };
    exports.read = function(fd, buffer, offset, length, position, callback) {
      if (typeof callback === "function") {
        return fs.read(fd, buffer, offset, length, position, callback);
      }
      return new Promise((resolve2, reject) => {
        fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
          if (err)
            return reject(err);
          resolve2({ bytesRead, buffer: buffer2 });
        });
      });
    };
    exports.write = function(fd, buffer, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs.write(fd, buffer, ...args);
      }
      return new Promise((resolve2, reject) => {
        fs.write(fd, buffer, ...args, (err, bytesWritten, buffer2) => {
          if (err)
            return reject(err);
          resolve2({ bytesWritten, buffer: buffer2 });
        });
      });
    };
    if (typeof fs.writev === "function") {
      exports.writev = function(fd, buffers, ...args) {
        if (typeof args[args.length - 1] === "function") {
          return fs.writev(fd, buffers, ...args);
        }
        return new Promise((resolve2, reject) => {
          fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers2) => {
            if (err)
              return reject(err);
            resolve2({ bytesWritten, buffers: buffers2 });
          });
        });
      };
    }
    if (typeof fs.realpath.native === "function") {
      exports.realpath.native = u(fs.realpath.native);
    } else {
      process.emitWarning(
        "fs.realpath.native is not a function. Is fs being monkey-patched?",
        "Warning",
        "fs-extra-WARN0003"
      );
    }
  }
});

// node_modules/fs-extra/lib/mkdirs/utils.js
var require_utils = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/utils.js"(exports, module2) {
    "use strict";
    var path2 = require("path");
    module2.exports.checkPath = function checkPath(pth) {
      if (process.platform === "win32") {
        const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path2.parse(pth).root, ""));
        if (pathHasInvalidWinCharacters) {
          const error = new Error(`Path contains invalid characters: ${pth}`);
          error.code = "EINVAL";
          throw error;
        }
      }
    };
  }
});

// node_modules/fs-extra/lib/mkdirs/make-dir.js
var require_make_dir = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/make-dir.js"(exports, module2) {
    "use strict";
    var fs = require_fs();
    var { checkPath } = require_utils();
    var getMode = (options) => {
      const defaults = { mode: 511 };
      if (typeof options === "number")
        return options;
      return { ...defaults, ...options }.mode;
    };
    module2.exports.makeDir = async (dir, options) => {
      checkPath(dir);
      return fs.mkdir(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
    module2.exports.makeDirSync = (dir, options) => {
      checkPath(dir);
      return fs.mkdirSync(dir, {
        mode: getMode(options),
        recursive: true
      });
    };
  }
});

// node_modules/fs-extra/lib/mkdirs/index.js
var require_mkdirs = __commonJS({
  "node_modules/fs-extra/lib/mkdirs/index.js"(exports, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var { makeDir: _makeDir, makeDirSync } = require_make_dir();
    var makeDir = u(_makeDir);
    module2.exports = {
      mkdirs: makeDir,
      mkdirsSync: makeDirSync,
      mkdirp: makeDir,
      mkdirpSync: makeDirSync,
      ensureDir: makeDir,
      ensureDirSync: makeDirSync
    };
  }
});

// node_modules/fs-extra/lib/path-exists/index.js
var require_path_exists = __commonJS({
  "node_modules/fs-extra/lib/path-exists/index.js"(exports, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var fs = require_fs();
    function pathExists(path2) {
      return fs.access(path2).then(() => true).catch(() => false);
    }
    module2.exports = {
      pathExists: u(pathExists),
      pathExistsSync: fs.existsSync
    };
  }
});

// node_modules/fs-extra/lib/util/utimes.js
var require_utimes = __commonJS({
  "node_modules/fs-extra/lib/util/utimes.js"(exports, module2) {
    "use strict";
    var fs = require_graceful_fs();
    function utimesMillis(path2, atime, mtime, callback) {
      fs.open(path2, "r+", (err, fd) => {
        if (err)
          return callback(err);
        fs.futimes(fd, atime, mtime, (futimesErr) => {
          fs.close(fd, (closeErr) => {
            if (callback)
              callback(futimesErr || closeErr);
          });
        });
      });
    }
    function utimesMillisSync(path2, atime, mtime) {
      const fd = fs.openSync(path2, "r+");
      fs.futimesSync(fd, atime, mtime);
      return fs.closeSync(fd);
    }
    module2.exports = {
      utimesMillis,
      utimesMillisSync
    };
  }
});

// node_modules/fs-extra/lib/util/stat.js
var require_stat = __commonJS({
  "node_modules/fs-extra/lib/util/stat.js"(exports, module2) {
    "use strict";
    var fs = require_fs();
    var path2 = require("path");
    var util = require("util");
    function getStats(src, dest, opts) {
      const statFunc = opts.dereference ? (file) => fs.stat(file, { bigint: true }) : (file) => fs.lstat(file, { bigint: true });
      return Promise.all([
        statFunc(src),
        statFunc(dest).catch((err) => {
          if (err.code === "ENOENT")
            return null;
          throw err;
        })
      ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
    }
    function getStatsSync(src, dest, opts) {
      let destStat;
      const statFunc = opts.dereference ? (file) => fs.statSync(file, { bigint: true }) : (file) => fs.lstatSync(file, { bigint: true });
      const srcStat = statFunc(src);
      try {
        destStat = statFunc(dest);
      } catch (err) {
        if (err.code === "ENOENT")
          return { srcStat, destStat: null };
        throw err;
      }
      return { srcStat, destStat };
    }
    function checkPaths(src, dest, funcName, opts, cb) {
      util.callbackify(getStats)(src, dest, opts, (err, stats) => {
        if (err)
          return cb(err);
        const { srcStat, destStat } = stats;
        if (destStat) {
          if (areIdentical(srcStat, destStat)) {
            const srcBaseName = path2.basename(src);
            const destBaseName = path2.basename(dest);
            if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
              return cb(null, { srcStat, destStat, isChangingCase: true });
            }
            return cb(new Error("Source and destination must not be the same."));
          }
          if (srcStat.isDirectory() && !destStat.isDirectory()) {
            return cb(new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`));
          }
          if (!srcStat.isDirectory() && destStat.isDirectory()) {
            return cb(new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`));
          }
        }
        if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
          return cb(new Error(errMsg(src, dest, funcName)));
        }
        return cb(null, { srcStat, destStat });
      });
    }
    function checkPathsSync(src, dest, funcName, opts) {
      const { srcStat, destStat } = getStatsSync(src, dest, opts);
      if (destStat) {
        if (areIdentical(srcStat, destStat)) {
          const srcBaseName = path2.basename(src);
          const destBaseName = path2.basename(dest);
          if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
            return { srcStat, destStat, isChangingCase: true };
          }
          throw new Error("Source and destination must not be the same.");
        }
        if (srcStat.isDirectory() && !destStat.isDirectory()) {
          throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
        }
        if (!srcStat.isDirectory() && destStat.isDirectory()) {
          throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
        }
      }
      if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return { srcStat, destStat };
    }
    function checkParentPaths(src, srcStat, dest, funcName, cb) {
      const srcParent = path2.resolve(path2.dirname(src));
      const destParent = path2.resolve(path2.dirname(dest));
      if (destParent === srcParent || destParent === path2.parse(destParent).root)
        return cb();
      fs.stat(destParent, { bigint: true }, (err, destStat) => {
        if (err) {
          if (err.code === "ENOENT")
            return cb();
          return cb(err);
        }
        if (areIdentical(srcStat, destStat)) {
          return cb(new Error(errMsg(src, dest, funcName)));
        }
        return checkParentPaths(src, srcStat, destParent, funcName, cb);
      });
    }
    function checkParentPathsSync(src, srcStat, dest, funcName) {
      const srcParent = path2.resolve(path2.dirname(src));
      const destParent = path2.resolve(path2.dirname(dest));
      if (destParent === srcParent || destParent === path2.parse(destParent).root)
        return;
      let destStat;
      try {
        destStat = fs.statSync(destParent, { bigint: true });
      } catch (err) {
        if (err.code === "ENOENT")
          return;
        throw err;
      }
      if (areIdentical(srcStat, destStat)) {
        throw new Error(errMsg(src, dest, funcName));
      }
      return checkParentPathsSync(src, srcStat, destParent, funcName);
    }
    function areIdentical(srcStat, destStat) {
      return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
    }
    function isSrcSubdir(src, dest) {
      const srcArr = path2.resolve(src).split(path2.sep).filter((i) => i);
      const destArr = path2.resolve(dest).split(path2.sep).filter((i) => i);
      return srcArr.reduce((acc, cur, i) => acc && destArr[i] === cur, true);
    }
    function errMsg(src, dest, funcName) {
      return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
    }
    module2.exports = {
      checkPaths,
      checkPathsSync,
      checkParentPaths,
      checkParentPathsSync,
      isSrcSubdir,
      areIdentical
    };
  }
});

// node_modules/fs-extra/lib/copy/copy.js
var require_copy = __commonJS({
  "node_modules/fs-extra/lib/copy/copy.js"(exports, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path2 = require("path");
    var mkdirs = require_mkdirs().mkdirs;
    var pathExists = require_path_exists().pathExists;
    var utimesMillis = require_utimes().utimesMillis;
    var stat = require_stat();
    function copy(src, dest, opts, cb) {
      if (typeof opts === "function" && !cb) {
        cb = opts;
        opts = {};
      } else if (typeof opts === "function") {
        opts = { filter: opts };
      }
      cb = cb || function() {
      };
      opts = opts || {};
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0001"
        );
      }
      stat.checkPaths(src, dest, "copy", opts, (err, stats) => {
        if (err)
          return cb(err);
        const { srcStat, destStat } = stats;
        stat.checkParentPaths(src, srcStat, dest, "copy", (err2) => {
          if (err2)
            return cb(err2);
          if (opts.filter)
            return handleFilter(checkParentDir, destStat, src, dest, opts, cb);
          return checkParentDir(destStat, src, dest, opts, cb);
        });
      });
    }
    function checkParentDir(destStat, src, dest, opts, cb) {
      const destParent = path2.dirname(dest);
      pathExists(destParent, (err, dirExists) => {
        if (err)
          return cb(err);
        if (dirExists)
          return getStats(destStat, src, dest, opts, cb);
        mkdirs(destParent, (err2) => {
          if (err2)
            return cb(err2);
          return getStats(destStat, src, dest, opts, cb);
        });
      });
    }
    function handleFilter(onInclude, destStat, src, dest, opts, cb) {
      Promise.resolve(opts.filter(src, dest)).then((include) => {
        if (include)
          return onInclude(destStat, src, dest, opts, cb);
        return cb();
      }, (error) => cb(error));
    }
    function startCopy(destStat, src, dest, opts, cb) {
      if (opts.filter)
        return handleFilter(getStats, destStat, src, dest, opts, cb);
      return getStats(destStat, src, dest, opts, cb);
    }
    function getStats(destStat, src, dest, opts, cb) {
      const stat2 = opts.dereference ? fs.stat : fs.lstat;
      stat2(src, (err, srcStat) => {
        if (err)
          return cb(err);
        if (srcStat.isDirectory())
          return onDir(srcStat, destStat, src, dest, opts, cb);
        else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice())
          return onFile(srcStat, destStat, src, dest, opts, cb);
        else if (srcStat.isSymbolicLink())
          return onLink(destStat, src, dest, opts, cb);
        else if (srcStat.isSocket())
          return cb(new Error(`Cannot copy a socket file: ${src}`));
        else if (srcStat.isFIFO())
          return cb(new Error(`Cannot copy a FIFO pipe: ${src}`));
        return cb(new Error(`Unknown file: ${src}`));
      });
    }
    function onFile(srcStat, destStat, src, dest, opts, cb) {
      if (!destStat)
        return copyFile(srcStat, src, dest, opts, cb);
      return mayCopyFile(srcStat, src, dest, opts, cb);
    }
    function mayCopyFile(srcStat, src, dest, opts, cb) {
      if (opts.overwrite) {
        fs.unlink(dest, (err) => {
          if (err)
            return cb(err);
          return copyFile(srcStat, src, dest, opts, cb);
        });
      } else if (opts.errorOnExist) {
        return cb(new Error(`'${dest}' already exists`));
      } else
        return cb();
    }
    function copyFile(srcStat, src, dest, opts, cb) {
      fs.copyFile(src, dest, (err) => {
        if (err)
          return cb(err);
        if (opts.preserveTimestamps)
          return handleTimestampsAndMode(srcStat.mode, src, dest, cb);
        return setDestMode(dest, srcStat.mode, cb);
      });
    }
    function handleTimestampsAndMode(srcMode, src, dest, cb) {
      if (fileIsNotWritable(srcMode)) {
        return makeFileWritable(dest, srcMode, (err) => {
          if (err)
            return cb(err);
          return setDestTimestampsAndMode(srcMode, src, dest, cb);
        });
      }
      return setDestTimestampsAndMode(srcMode, src, dest, cb);
    }
    function fileIsNotWritable(srcMode) {
      return (srcMode & 128) === 0;
    }
    function makeFileWritable(dest, srcMode, cb) {
      return setDestMode(dest, srcMode | 128, cb);
    }
    function setDestTimestampsAndMode(srcMode, src, dest, cb) {
      setDestTimestamps(src, dest, (err) => {
        if (err)
          return cb(err);
        return setDestMode(dest, srcMode, cb);
      });
    }
    function setDestMode(dest, srcMode, cb) {
      return fs.chmod(dest, srcMode, cb);
    }
    function setDestTimestamps(src, dest, cb) {
      fs.stat(src, (err, updatedSrcStat) => {
        if (err)
          return cb(err);
        return utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime, cb);
      });
    }
    function onDir(srcStat, destStat, src, dest, opts, cb) {
      if (!destStat)
        return mkDirAndCopy(srcStat.mode, src, dest, opts, cb);
      return copyDir(src, dest, opts, cb);
    }
    function mkDirAndCopy(srcMode, src, dest, opts, cb) {
      fs.mkdir(dest, (err) => {
        if (err)
          return cb(err);
        copyDir(src, dest, opts, (err2) => {
          if (err2)
            return cb(err2);
          return setDestMode(dest, srcMode, cb);
        });
      });
    }
    function copyDir(src, dest, opts, cb) {
      fs.readdir(src, (err, items) => {
        if (err)
          return cb(err);
        return copyDirItems(items, src, dest, opts, cb);
      });
    }
    function copyDirItems(items, src, dest, opts, cb) {
      const item = items.pop();
      if (!item)
        return cb();
      return copyDirItem(items, item, src, dest, opts, cb);
    }
    function copyDirItem(items, item, src, dest, opts, cb) {
      const srcItem = path2.join(src, item);
      const destItem = path2.join(dest, item);
      stat.checkPaths(srcItem, destItem, "copy", opts, (err, stats) => {
        if (err)
          return cb(err);
        const { destStat } = stats;
        startCopy(destStat, srcItem, destItem, opts, (err2) => {
          if (err2)
            return cb(err2);
          return copyDirItems(items, src, dest, opts, cb);
        });
      });
    }
    function onLink(destStat, src, dest, opts, cb) {
      fs.readlink(src, (err, resolvedSrc) => {
        if (err)
          return cb(err);
        if (opts.dereference) {
          resolvedSrc = path2.resolve(process.cwd(), resolvedSrc);
        }
        if (!destStat) {
          return fs.symlink(resolvedSrc, dest, cb);
        } else {
          fs.readlink(dest, (err2, resolvedDest) => {
            if (err2) {
              if (err2.code === "EINVAL" || err2.code === "UNKNOWN")
                return fs.symlink(resolvedSrc, dest, cb);
              return cb(err2);
            }
            if (opts.dereference) {
              resolvedDest = path2.resolve(process.cwd(), resolvedDest);
            }
            if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
              return cb(new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`));
            }
            if (destStat.isDirectory() && stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
              return cb(new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`));
            }
            return copyLink(resolvedSrc, dest, cb);
          });
        }
      });
    }
    function copyLink(resolvedSrc, dest, cb) {
      fs.unlink(dest, (err) => {
        if (err)
          return cb(err);
        return fs.symlink(resolvedSrc, dest, cb);
      });
    }
    module2.exports = copy;
  }
});

// node_modules/fs-extra/lib/copy/copy-sync.js
var require_copy_sync = __commonJS({
  "node_modules/fs-extra/lib/copy/copy-sync.js"(exports, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path2 = require("path");
    var mkdirsSync = require_mkdirs().mkdirsSync;
    var utimesMillisSync = require_utimes().utimesMillisSync;
    var stat = require_stat();
    function copySync(src, dest, opts) {
      if (typeof opts === "function") {
        opts = { filter: opts };
      }
      opts = opts || {};
      opts.clobber = "clobber" in opts ? !!opts.clobber : true;
      opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
      if (opts.preserveTimestamps && process.arch === "ia32") {
        process.emitWarning(
          "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
          "Warning",
          "fs-extra-WARN0002"
        );
      }
      const { srcStat, destStat } = stat.checkPathsSync(src, dest, "copy", opts);
      stat.checkParentPathsSync(src, srcStat, dest, "copy");
      return handleFilterAndCopy(destStat, src, dest, opts);
    }
    function handleFilterAndCopy(destStat, src, dest, opts) {
      if (opts.filter && !opts.filter(src, dest))
        return;
      const destParent = path2.dirname(dest);
      if (!fs.existsSync(destParent))
        mkdirsSync(destParent);
      return getStats(destStat, src, dest, opts);
    }
    function startCopy(destStat, src, dest, opts) {
      if (opts.filter && !opts.filter(src, dest))
        return;
      return getStats(destStat, src, dest, opts);
    }
    function getStats(destStat, src, dest, opts) {
      const statSync = opts.dereference ? fs.statSync : fs.lstatSync;
      const srcStat = statSync(src);
      if (srcStat.isDirectory())
        return onDir(srcStat, destStat, src, dest, opts);
      else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice())
        return onFile(srcStat, destStat, src, dest, opts);
      else if (srcStat.isSymbolicLink())
        return onLink(destStat, src, dest, opts);
      else if (srcStat.isSocket())
        throw new Error(`Cannot copy a socket file: ${src}`);
      else if (srcStat.isFIFO())
        throw new Error(`Cannot copy a FIFO pipe: ${src}`);
      throw new Error(`Unknown file: ${src}`);
    }
    function onFile(srcStat, destStat, src, dest, opts) {
      if (!destStat)
        return copyFile(srcStat, src, dest, opts);
      return mayCopyFile(srcStat, src, dest, opts);
    }
    function mayCopyFile(srcStat, src, dest, opts) {
      if (opts.overwrite) {
        fs.unlinkSync(dest);
        return copyFile(srcStat, src, dest, opts);
      } else if (opts.errorOnExist) {
        throw new Error(`'${dest}' already exists`);
      }
    }
    function copyFile(srcStat, src, dest, opts) {
      fs.copyFileSync(src, dest);
      if (opts.preserveTimestamps)
        handleTimestamps(srcStat.mode, src, dest);
      return setDestMode(dest, srcStat.mode);
    }
    function handleTimestamps(srcMode, src, dest) {
      if (fileIsNotWritable(srcMode))
        makeFileWritable(dest, srcMode);
      return setDestTimestamps(src, dest);
    }
    function fileIsNotWritable(srcMode) {
      return (srcMode & 128) === 0;
    }
    function makeFileWritable(dest, srcMode) {
      return setDestMode(dest, srcMode | 128);
    }
    function setDestMode(dest, srcMode) {
      return fs.chmodSync(dest, srcMode);
    }
    function setDestTimestamps(src, dest) {
      const updatedSrcStat = fs.statSync(src);
      return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
    }
    function onDir(srcStat, destStat, src, dest, opts) {
      if (!destStat)
        return mkDirAndCopy(srcStat.mode, src, dest, opts);
      return copyDir(src, dest, opts);
    }
    function mkDirAndCopy(srcMode, src, dest, opts) {
      fs.mkdirSync(dest);
      copyDir(src, dest, opts);
      return setDestMode(dest, srcMode);
    }
    function copyDir(src, dest, opts) {
      fs.readdirSync(src).forEach((item) => copyDirItem(item, src, dest, opts));
    }
    function copyDirItem(item, src, dest, opts) {
      const srcItem = path2.join(src, item);
      const destItem = path2.join(dest, item);
      const { destStat } = stat.checkPathsSync(srcItem, destItem, "copy", opts);
      return startCopy(destStat, srcItem, destItem, opts);
    }
    function onLink(destStat, src, dest, opts) {
      let resolvedSrc = fs.readlinkSync(src);
      if (opts.dereference) {
        resolvedSrc = path2.resolve(process.cwd(), resolvedSrc);
      }
      if (!destStat) {
        return fs.symlinkSync(resolvedSrc, dest);
      } else {
        let resolvedDest;
        try {
          resolvedDest = fs.readlinkSync(dest);
        } catch (err) {
          if (err.code === "EINVAL" || err.code === "UNKNOWN")
            return fs.symlinkSync(resolvedSrc, dest);
          throw err;
        }
        if (opts.dereference) {
          resolvedDest = path2.resolve(process.cwd(), resolvedDest);
        }
        if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
          throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
        }
        if (fs.statSync(dest).isDirectory() && stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
          throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
        }
        return copyLink(resolvedSrc, dest);
      }
    }
    function copyLink(resolvedSrc, dest) {
      fs.unlinkSync(dest);
      return fs.symlinkSync(resolvedSrc, dest);
    }
    module2.exports = copySync;
  }
});

// node_modules/fs-extra/lib/copy/index.js
var require_copy2 = __commonJS({
  "node_modules/fs-extra/lib/copy/index.js"(exports, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    module2.exports = {
      copy: u(require_copy()),
      copySync: require_copy_sync()
    };
  }
});

// node_modules/fs-extra/lib/remove/rimraf.js
var require_rimraf = __commonJS({
  "node_modules/fs-extra/lib/remove/rimraf.js"(exports, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path2 = require("path");
    var assert = require("assert");
    var isWindows = process.platform === "win32";
    function defaults(options) {
      const methods = [
        "unlink",
        "chmod",
        "stat",
        "lstat",
        "rmdir",
        "readdir"
      ];
      methods.forEach((m) => {
        options[m] = options[m] || fs[m];
        m = m + "Sync";
        options[m] = options[m] || fs[m];
      });
      options.maxBusyTries = options.maxBusyTries || 3;
    }
    function rimraf(p, options, cb) {
      let busyTries = 0;
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      assert(p, "rimraf: missing path");
      assert.strictEqual(typeof p, "string", "rimraf: path should be a string");
      assert.strictEqual(typeof cb, "function", "rimraf: callback function required");
      assert(options, "rimraf: invalid options argument provided");
      assert.strictEqual(typeof options, "object", "rimraf: options should be object");
      defaults(options);
      rimraf_(p, options, function CB(er) {
        if (er) {
          if ((er.code === "EBUSY" || er.code === "ENOTEMPTY" || er.code === "EPERM") && busyTries < options.maxBusyTries) {
            busyTries++;
            const time = busyTries * 100;
            return setTimeout(() => rimraf_(p, options, CB), time);
          }
          if (er.code === "ENOENT")
            er = null;
        }
        cb(er);
      });
    }
    function rimraf_(p, options, cb) {
      assert(p);
      assert(options);
      assert(typeof cb === "function");
      options.lstat(p, (er, st) => {
        if (er && er.code === "ENOENT") {
          return cb(null);
        }
        if (er && er.code === "EPERM" && isWindows) {
          return fixWinEPERM(p, options, er, cb);
        }
        if (st && st.isDirectory()) {
          return rmdir(p, options, er, cb);
        }
        options.unlink(p, (er2) => {
          if (er2) {
            if (er2.code === "ENOENT") {
              return cb(null);
            }
            if (er2.code === "EPERM") {
              return isWindows ? fixWinEPERM(p, options, er2, cb) : rmdir(p, options, er2, cb);
            }
            if (er2.code === "EISDIR") {
              return rmdir(p, options, er2, cb);
            }
          }
          return cb(er2);
        });
      });
    }
    function fixWinEPERM(p, options, er, cb) {
      assert(p);
      assert(options);
      assert(typeof cb === "function");
      options.chmod(p, 438, (er2) => {
        if (er2) {
          cb(er2.code === "ENOENT" ? null : er);
        } else {
          options.stat(p, (er3, stats) => {
            if (er3) {
              cb(er3.code === "ENOENT" ? null : er);
            } else if (stats.isDirectory()) {
              rmdir(p, options, er, cb);
            } else {
              options.unlink(p, cb);
            }
          });
        }
      });
    }
    function fixWinEPERMSync(p, options, er) {
      let stats;
      assert(p);
      assert(options);
      try {
        options.chmodSync(p, 438);
      } catch (er2) {
        if (er2.code === "ENOENT") {
          return;
        } else {
          throw er;
        }
      }
      try {
        stats = options.statSync(p);
      } catch (er3) {
        if (er3.code === "ENOENT") {
          return;
        } else {
          throw er;
        }
      }
      if (stats.isDirectory()) {
        rmdirSync(p, options, er);
      } else {
        options.unlinkSync(p);
      }
    }
    function rmdir(p, options, originalEr, cb) {
      assert(p);
      assert(options);
      assert(typeof cb === "function");
      options.rmdir(p, (er) => {
        if (er && (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM")) {
          rmkids(p, options, cb);
        } else if (er && er.code === "ENOTDIR") {
          cb(originalEr);
        } else {
          cb(er);
        }
      });
    }
    function rmkids(p, options, cb) {
      assert(p);
      assert(options);
      assert(typeof cb === "function");
      options.readdir(p, (er, files) => {
        if (er)
          return cb(er);
        let n = files.length;
        let errState;
        if (n === 0)
          return options.rmdir(p, cb);
        files.forEach((f) => {
          rimraf(path2.join(p, f), options, (er2) => {
            if (errState) {
              return;
            }
            if (er2)
              return cb(errState = er2);
            if (--n === 0) {
              options.rmdir(p, cb);
            }
          });
        });
      });
    }
    function rimrafSync(p, options) {
      let st;
      options = options || {};
      defaults(options);
      assert(p, "rimraf: missing path");
      assert.strictEqual(typeof p, "string", "rimraf: path should be a string");
      assert(options, "rimraf: missing options");
      assert.strictEqual(typeof options, "object", "rimraf: options should be object");
      try {
        st = options.lstatSync(p);
      } catch (er) {
        if (er.code === "ENOENT") {
          return;
        }
        if (er.code === "EPERM" && isWindows) {
          fixWinEPERMSync(p, options, er);
        }
      }
      try {
        if (st && st.isDirectory()) {
          rmdirSync(p, options, null);
        } else {
          options.unlinkSync(p);
        }
      } catch (er) {
        if (er.code === "ENOENT") {
          return;
        } else if (er.code === "EPERM") {
          return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er);
        } else if (er.code !== "EISDIR") {
          throw er;
        }
        rmdirSync(p, options, er);
      }
    }
    function rmdirSync(p, options, originalEr) {
      assert(p);
      assert(options);
      try {
        options.rmdirSync(p);
      } catch (er) {
        if (er.code === "ENOTDIR") {
          throw originalEr;
        } else if (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM") {
          rmkidsSync(p, options);
        } else if (er.code !== "ENOENT") {
          throw er;
        }
      }
    }
    function rmkidsSync(p, options) {
      assert(p);
      assert(options);
      options.readdirSync(p).forEach((f) => rimrafSync(path2.join(p, f), options));
      if (isWindows) {
        const startTime = Date.now();
        do {
          try {
            const ret = options.rmdirSync(p, options);
            return ret;
          } catch {
          }
        } while (Date.now() - startTime < 500);
      } else {
        const ret = options.rmdirSync(p, options);
        return ret;
      }
    }
    module2.exports = rimraf;
    rimraf.sync = rimrafSync;
  }
});

// node_modules/fs-extra/lib/remove/index.js
var require_remove = __commonJS({
  "node_modules/fs-extra/lib/remove/index.js"(exports, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var u = require_universalify().fromCallback;
    var rimraf = require_rimraf();
    function remove(path2, callback) {
      if (fs.rm)
        return fs.rm(path2, { recursive: true, force: true }, callback);
      rimraf(path2, callback);
    }
    function removeSync(path2) {
      if (fs.rmSync)
        return fs.rmSync(path2, { recursive: true, force: true });
      rimraf.sync(path2);
    }
    module2.exports = {
      remove: u(remove),
      removeSync
    };
  }
});

// node_modules/fs-extra/lib/empty/index.js
var require_empty = __commonJS({
  "node_modules/fs-extra/lib/empty/index.js"(exports, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var fs = require_fs();
    var path2 = require("path");
    var mkdir = require_mkdirs();
    var remove = require_remove();
    var emptyDir = u(async function emptyDir2(dir) {
      let items;
      try {
        items = await fs.readdir(dir);
      } catch {
        return mkdir.mkdirs(dir);
      }
      return Promise.all(items.map((item) => remove.remove(path2.join(dir, item))));
    });
    function emptyDirSync(dir) {
      let items;
      try {
        items = fs.readdirSync(dir);
      } catch {
        return mkdir.mkdirsSync(dir);
      }
      items.forEach((item) => {
        item = path2.join(dir, item);
        remove.removeSync(item);
      });
    }
    module2.exports = {
      emptyDirSync,
      emptydirSync: emptyDirSync,
      emptyDir,
      emptydir: emptyDir
    };
  }
});

// node_modules/fs-extra/lib/ensure/file.js
var require_file = __commonJS({
  "node_modules/fs-extra/lib/ensure/file.js"(exports, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    var path2 = require("path");
    var fs = require_graceful_fs();
    var mkdir = require_mkdirs();
    function createFile(file, callback) {
      function makeFile() {
        fs.writeFile(file, "", (err) => {
          if (err)
            return callback(err);
          callback();
        });
      }
      fs.stat(file, (err, stats) => {
        if (!err && stats.isFile())
          return callback();
        const dir = path2.dirname(file);
        fs.stat(dir, (err2, stats2) => {
          if (err2) {
            if (err2.code === "ENOENT") {
              return mkdir.mkdirs(dir, (err3) => {
                if (err3)
                  return callback(err3);
                makeFile();
              });
            }
            return callback(err2);
          }
          if (stats2.isDirectory())
            makeFile();
          else {
            fs.readdir(dir, (err3) => {
              if (err3)
                return callback(err3);
            });
          }
        });
      });
    }
    function createFileSync(file) {
      let stats;
      try {
        stats = fs.statSync(file);
      } catch {
      }
      if (stats && stats.isFile())
        return;
      const dir = path2.dirname(file);
      try {
        if (!fs.statSync(dir).isDirectory()) {
          fs.readdirSync(dir);
        }
      } catch (err) {
        if (err && err.code === "ENOENT")
          mkdir.mkdirsSync(dir);
        else
          throw err;
      }
      fs.writeFileSync(file, "");
    }
    module2.exports = {
      createFile: u(createFile),
      createFileSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/link.js
var require_link = __commonJS({
  "node_modules/fs-extra/lib/ensure/link.js"(exports, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    var path2 = require("path");
    var fs = require_graceful_fs();
    var mkdir = require_mkdirs();
    var pathExists = require_path_exists().pathExists;
    var { areIdentical } = require_stat();
    function createLink(srcpath, dstpath, callback) {
      function makeLink(srcpath2, dstpath2) {
        fs.link(srcpath2, dstpath2, (err) => {
          if (err)
            return callback(err);
          callback(null);
        });
      }
      fs.lstat(dstpath, (_, dstStat) => {
        fs.lstat(srcpath, (err, srcStat) => {
          if (err) {
            err.message = err.message.replace("lstat", "ensureLink");
            return callback(err);
          }
          if (dstStat && areIdentical(srcStat, dstStat))
            return callback(null);
          const dir = path2.dirname(dstpath);
          pathExists(dir, (err2, dirExists) => {
            if (err2)
              return callback(err2);
            if (dirExists)
              return makeLink(srcpath, dstpath);
            mkdir.mkdirs(dir, (err3) => {
              if (err3)
                return callback(err3);
              makeLink(srcpath, dstpath);
            });
          });
        });
      });
    }
    function createLinkSync(srcpath, dstpath) {
      let dstStat;
      try {
        dstStat = fs.lstatSync(dstpath);
      } catch {
      }
      try {
        const srcStat = fs.lstatSync(srcpath);
        if (dstStat && areIdentical(srcStat, dstStat))
          return;
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureLink");
        throw err;
      }
      const dir = path2.dirname(dstpath);
      const dirExists = fs.existsSync(dir);
      if (dirExists)
        return fs.linkSync(srcpath, dstpath);
      mkdir.mkdirsSync(dir);
      return fs.linkSync(srcpath, dstpath);
    }
    module2.exports = {
      createLink: u(createLink),
      createLinkSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink-paths.js
var require_symlink_paths = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink-paths.js"(exports, module2) {
    "use strict";
    var path2 = require("path");
    var fs = require_graceful_fs();
    var pathExists = require_path_exists().pathExists;
    function symlinkPaths(srcpath, dstpath, callback) {
      if (path2.isAbsolute(srcpath)) {
        return fs.lstat(srcpath, (err) => {
          if (err) {
            err.message = err.message.replace("lstat", "ensureSymlink");
            return callback(err);
          }
          return callback(null, {
            toCwd: srcpath,
            toDst: srcpath
          });
        });
      } else {
        const dstdir = path2.dirname(dstpath);
        const relativeToDst = path2.join(dstdir, srcpath);
        return pathExists(relativeToDst, (err, exists) => {
          if (err)
            return callback(err);
          if (exists) {
            return callback(null, {
              toCwd: relativeToDst,
              toDst: srcpath
            });
          } else {
            return fs.lstat(srcpath, (err2) => {
              if (err2) {
                err2.message = err2.message.replace("lstat", "ensureSymlink");
                return callback(err2);
              }
              return callback(null, {
                toCwd: srcpath,
                toDst: path2.relative(dstdir, srcpath)
              });
            });
          }
        });
      }
    }
    function symlinkPathsSync(srcpath, dstpath) {
      let exists;
      if (path2.isAbsolute(srcpath)) {
        exists = fs.existsSync(srcpath);
        if (!exists)
          throw new Error("absolute srcpath does not exist");
        return {
          toCwd: srcpath,
          toDst: srcpath
        };
      } else {
        const dstdir = path2.dirname(dstpath);
        const relativeToDst = path2.join(dstdir, srcpath);
        exists = fs.existsSync(relativeToDst);
        if (exists) {
          return {
            toCwd: relativeToDst,
            toDst: srcpath
          };
        } else {
          exists = fs.existsSync(srcpath);
          if (!exists)
            throw new Error("relative srcpath does not exist");
          return {
            toCwd: srcpath,
            toDst: path2.relative(dstdir, srcpath)
          };
        }
      }
    }
    module2.exports = {
      symlinkPaths,
      symlinkPathsSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink-type.js
var require_symlink_type = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink-type.js"(exports, module2) {
    "use strict";
    var fs = require_graceful_fs();
    function symlinkType(srcpath, type, callback) {
      callback = typeof type === "function" ? type : callback;
      type = typeof type === "function" ? false : type;
      if (type)
        return callback(null, type);
      fs.lstat(srcpath, (err, stats) => {
        if (err)
          return callback(null, "file");
        type = stats && stats.isDirectory() ? "dir" : "file";
        callback(null, type);
      });
    }
    function symlinkTypeSync(srcpath, type) {
      let stats;
      if (type)
        return type;
      try {
        stats = fs.lstatSync(srcpath);
      } catch {
        return "file";
      }
      return stats && stats.isDirectory() ? "dir" : "file";
    }
    module2.exports = {
      symlinkType,
      symlinkTypeSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/symlink.js
var require_symlink = __commonJS({
  "node_modules/fs-extra/lib/ensure/symlink.js"(exports, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    var path2 = require("path");
    var fs = require_fs();
    var _mkdirs = require_mkdirs();
    var mkdirs = _mkdirs.mkdirs;
    var mkdirsSync = _mkdirs.mkdirsSync;
    var _symlinkPaths = require_symlink_paths();
    var symlinkPaths = _symlinkPaths.symlinkPaths;
    var symlinkPathsSync = _symlinkPaths.symlinkPathsSync;
    var _symlinkType = require_symlink_type();
    var symlinkType = _symlinkType.symlinkType;
    var symlinkTypeSync = _symlinkType.symlinkTypeSync;
    var pathExists = require_path_exists().pathExists;
    var { areIdentical } = require_stat();
    function createSymlink(srcpath, dstpath, type, callback) {
      callback = typeof type === "function" ? type : callback;
      type = typeof type === "function" ? false : type;
      fs.lstat(dstpath, (err, stats) => {
        if (!err && stats.isSymbolicLink()) {
          Promise.all([
            fs.stat(srcpath),
            fs.stat(dstpath)
          ]).then(([srcStat, dstStat]) => {
            if (areIdentical(srcStat, dstStat))
              return callback(null);
            _createSymlink(srcpath, dstpath, type, callback);
          });
        } else
          _createSymlink(srcpath, dstpath, type, callback);
      });
    }
    function _createSymlink(srcpath, dstpath, type, callback) {
      symlinkPaths(srcpath, dstpath, (err, relative) => {
        if (err)
          return callback(err);
        srcpath = relative.toDst;
        symlinkType(relative.toCwd, type, (err2, type2) => {
          if (err2)
            return callback(err2);
          const dir = path2.dirname(dstpath);
          pathExists(dir, (err3, dirExists) => {
            if (err3)
              return callback(err3);
            if (dirExists)
              return fs.symlink(srcpath, dstpath, type2, callback);
            mkdirs(dir, (err4) => {
              if (err4)
                return callback(err4);
              fs.symlink(srcpath, dstpath, type2, callback);
            });
          });
        });
      });
    }
    function createSymlinkSync(srcpath, dstpath, type) {
      let stats;
      try {
        stats = fs.lstatSync(dstpath);
      } catch {
      }
      if (stats && stats.isSymbolicLink()) {
        const srcStat = fs.statSync(srcpath);
        const dstStat = fs.statSync(dstpath);
        if (areIdentical(srcStat, dstStat))
          return;
      }
      const relative = symlinkPathsSync(srcpath, dstpath);
      srcpath = relative.toDst;
      type = symlinkTypeSync(relative.toCwd, type);
      const dir = path2.dirname(dstpath);
      const exists = fs.existsSync(dir);
      if (exists)
        return fs.symlinkSync(srcpath, dstpath, type);
      mkdirsSync(dir);
      return fs.symlinkSync(srcpath, dstpath, type);
    }
    module2.exports = {
      createSymlink: u(createSymlink),
      createSymlinkSync
    };
  }
});

// node_modules/fs-extra/lib/ensure/index.js
var require_ensure = __commonJS({
  "node_modules/fs-extra/lib/ensure/index.js"(exports, module2) {
    "use strict";
    var { createFile, createFileSync } = require_file();
    var { createLink, createLinkSync } = require_link();
    var { createSymlink, createSymlinkSync } = require_symlink();
    module2.exports = {
      createFile,
      createFileSync,
      ensureFile: createFile,
      ensureFileSync: createFileSync,
      createLink,
      createLinkSync,
      ensureLink: createLink,
      ensureLinkSync: createLinkSync,
      createSymlink,
      createSymlinkSync,
      ensureSymlink: createSymlink,
      ensureSymlinkSync: createSymlinkSync
    };
  }
});

// node_modules/jsonfile/utils.js
var require_utils2 = __commonJS({
  "node_modules/jsonfile/utils.js"(exports, module2) {
    function stringify(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
      const EOF = finalEOL ? EOL : "";
      const str = JSON.stringify(obj, replacer, spaces);
      return str.replace(/\n/g, EOL) + EOF;
    }
    function stripBom(content) {
      if (Buffer.isBuffer(content))
        content = content.toString("utf8");
      return content.replace(/^\uFEFF/, "");
    }
    module2.exports = { stringify, stripBom };
  }
});

// node_modules/jsonfile/index.js
var require_jsonfile = __commonJS({
  "node_modules/jsonfile/index.js"(exports, module2) {
    var _fs;
    try {
      _fs = require_graceful_fs();
    } catch (_) {
      _fs = require("fs");
    }
    var universalify = require_universalify();
    var { stringify, stripBom } = require_utils2();
    async function _readFile(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      let data = await universalify.fromCallback(fs.readFile)(file, options);
      data = stripBom(data);
      let obj;
      try {
        obj = JSON.parse(data, options ? options.reviver : null);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
      return obj;
    }
    var readFile = universalify.fromPromise(_readFile);
    function readFileSync(file, options = {}) {
      if (typeof options === "string") {
        options = { encoding: options };
      }
      const fs = options.fs || _fs;
      const shouldThrow = "throws" in options ? options.throws : true;
      try {
        let content = fs.readFileSync(file, options);
        content = stripBom(content);
        return JSON.parse(content, options.reviver);
      } catch (err) {
        if (shouldThrow) {
          err.message = `${file}: ${err.message}`;
          throw err;
        } else {
          return null;
        }
      }
    }
    async function _writeFile(file, obj, options = {}) {
      const fs = options.fs || _fs;
      const str = stringify(obj, options);
      await universalify.fromCallback(fs.writeFile)(file, str, options);
    }
    var writeFile = universalify.fromPromise(_writeFile);
    function writeFileSync(file, obj, options = {}) {
      const fs = options.fs || _fs;
      const str = stringify(obj, options);
      return fs.writeFileSync(file, str, options);
    }
    var jsonfile = {
      readFile,
      readFileSync,
      writeFile,
      writeFileSync
    };
    module2.exports = jsonfile;
  }
});

// node_modules/fs-extra/lib/json/jsonfile.js
var require_jsonfile2 = __commonJS({
  "node_modules/fs-extra/lib/json/jsonfile.js"(exports, module2) {
    "use strict";
    var jsonFile = require_jsonfile();
    module2.exports = {
      readJson: jsonFile.readFile,
      readJsonSync: jsonFile.readFileSync,
      writeJson: jsonFile.writeFile,
      writeJsonSync: jsonFile.writeFileSync
    };
  }
});

// node_modules/fs-extra/lib/output-file/index.js
var require_output_file = __commonJS({
  "node_modules/fs-extra/lib/output-file/index.js"(exports, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    var fs = require_graceful_fs();
    var path2 = require("path");
    var mkdir = require_mkdirs();
    var pathExists = require_path_exists().pathExists;
    function outputFile(file, data, encoding, callback) {
      if (typeof encoding === "function") {
        callback = encoding;
        encoding = "utf8";
      }
      const dir = path2.dirname(file);
      pathExists(dir, (err, itDoes) => {
        if (err)
          return callback(err);
        if (itDoes)
          return fs.writeFile(file, data, encoding, callback);
        mkdir.mkdirs(dir, (err2) => {
          if (err2)
            return callback(err2);
          fs.writeFile(file, data, encoding, callback);
        });
      });
    }
    function outputFileSync(file, ...args) {
      const dir = path2.dirname(file);
      if (fs.existsSync(dir)) {
        return fs.writeFileSync(file, ...args);
      }
      mkdir.mkdirsSync(dir);
      fs.writeFileSync(file, ...args);
    }
    module2.exports = {
      outputFile: u(outputFile),
      outputFileSync
    };
  }
});

// node_modules/fs-extra/lib/json/output-json.js
var require_output_json = __commonJS({
  "node_modules/fs-extra/lib/json/output-json.js"(exports, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFile } = require_output_file();
    async function outputJson(file, data, options = {}) {
      const str = stringify(data, options);
      await outputFile(file, str, options);
    }
    module2.exports = outputJson;
  }
});

// node_modules/fs-extra/lib/json/output-json-sync.js
var require_output_json_sync = __commonJS({
  "node_modules/fs-extra/lib/json/output-json-sync.js"(exports, module2) {
    "use strict";
    var { stringify } = require_utils2();
    var { outputFileSync } = require_output_file();
    function outputJsonSync(file, data, options) {
      const str = stringify(data, options);
      outputFileSync(file, str, options);
    }
    module2.exports = outputJsonSync;
  }
});

// node_modules/fs-extra/lib/json/index.js
var require_json = __commonJS({
  "node_modules/fs-extra/lib/json/index.js"(exports, module2) {
    "use strict";
    var u = require_universalify().fromPromise;
    var jsonFile = require_jsonfile2();
    jsonFile.outputJson = u(require_output_json());
    jsonFile.outputJsonSync = require_output_json_sync();
    jsonFile.outputJSON = jsonFile.outputJson;
    jsonFile.outputJSONSync = jsonFile.outputJsonSync;
    jsonFile.writeJSON = jsonFile.writeJson;
    jsonFile.writeJSONSync = jsonFile.writeJsonSync;
    jsonFile.readJSON = jsonFile.readJson;
    jsonFile.readJSONSync = jsonFile.readJsonSync;
    module2.exports = jsonFile;
  }
});

// node_modules/fs-extra/lib/move/move.js
var require_move = __commonJS({
  "node_modules/fs-extra/lib/move/move.js"(exports, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path2 = require("path");
    var copy = require_copy2().copy;
    var remove = require_remove().remove;
    var mkdirp = require_mkdirs().mkdirp;
    var pathExists = require_path_exists().pathExists;
    var stat = require_stat();
    function move(src, dest, opts, cb) {
      if (typeof opts === "function") {
        cb = opts;
        opts = {};
      }
      opts = opts || {};
      const overwrite = opts.overwrite || opts.clobber || false;
      stat.checkPaths(src, dest, "move", opts, (err, stats) => {
        if (err)
          return cb(err);
        const { srcStat, isChangingCase = false } = stats;
        stat.checkParentPaths(src, srcStat, dest, "move", (err2) => {
          if (err2)
            return cb(err2);
          if (isParentRoot(dest))
            return doRename(src, dest, overwrite, isChangingCase, cb);
          mkdirp(path2.dirname(dest), (err3) => {
            if (err3)
              return cb(err3);
            return doRename(src, dest, overwrite, isChangingCase, cb);
          });
        });
      });
    }
    function isParentRoot(dest) {
      const parent = path2.dirname(dest);
      const parsedPath = path2.parse(parent);
      return parsedPath.root === parent;
    }
    function doRename(src, dest, overwrite, isChangingCase, cb) {
      if (isChangingCase)
        return rename(src, dest, overwrite, cb);
      if (overwrite) {
        return remove(dest, (err) => {
          if (err)
            return cb(err);
          return rename(src, dest, overwrite, cb);
        });
      }
      pathExists(dest, (err, destExists) => {
        if (err)
          return cb(err);
        if (destExists)
          return cb(new Error("dest already exists."));
        return rename(src, dest, overwrite, cb);
      });
    }
    function rename(src, dest, overwrite, cb) {
      fs.rename(src, dest, (err) => {
        if (!err)
          return cb();
        if (err.code !== "EXDEV")
          return cb(err);
        return moveAcrossDevice(src, dest, overwrite, cb);
      });
    }
    function moveAcrossDevice(src, dest, overwrite, cb) {
      const opts = {
        overwrite,
        errorOnExist: true
      };
      copy(src, dest, opts, (err) => {
        if (err)
          return cb(err);
        return remove(src, cb);
      });
    }
    module2.exports = move;
  }
});

// node_modules/fs-extra/lib/move/move-sync.js
var require_move_sync = __commonJS({
  "node_modules/fs-extra/lib/move/move-sync.js"(exports, module2) {
    "use strict";
    var fs = require_graceful_fs();
    var path2 = require("path");
    var copySync = require_copy2().copySync;
    var removeSync = require_remove().removeSync;
    var mkdirpSync = require_mkdirs().mkdirpSync;
    var stat = require_stat();
    function moveSync(src, dest, opts) {
      opts = opts || {};
      const overwrite = opts.overwrite || opts.clobber || false;
      const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, "move", opts);
      stat.checkParentPathsSync(src, srcStat, dest, "move");
      if (!isParentRoot(dest))
        mkdirpSync(path2.dirname(dest));
      return doRename(src, dest, overwrite, isChangingCase);
    }
    function isParentRoot(dest) {
      const parent = path2.dirname(dest);
      const parsedPath = path2.parse(parent);
      return parsedPath.root === parent;
    }
    function doRename(src, dest, overwrite, isChangingCase) {
      if (isChangingCase)
        return rename(src, dest, overwrite);
      if (overwrite) {
        removeSync(dest);
        return rename(src, dest, overwrite);
      }
      if (fs.existsSync(dest))
        throw new Error("dest already exists.");
      return rename(src, dest, overwrite);
    }
    function rename(src, dest, overwrite) {
      try {
        fs.renameSync(src, dest);
      } catch (err) {
        if (err.code !== "EXDEV")
          throw err;
        return moveAcrossDevice(src, dest, overwrite);
      }
    }
    function moveAcrossDevice(src, dest, overwrite) {
      const opts = {
        overwrite,
        errorOnExist: true
      };
      copySync(src, dest, opts);
      return removeSync(src);
    }
    module2.exports = moveSync;
  }
});

// node_modules/fs-extra/lib/move/index.js
var require_move2 = __commonJS({
  "node_modules/fs-extra/lib/move/index.js"(exports, module2) {
    "use strict";
    var u = require_universalify().fromCallback;
    module2.exports = {
      move: u(require_move()),
      moveSync: require_move_sync()
    };
  }
});

// node_modules/fs-extra/lib/index.js
var require_lib = __commonJS({
  "node_modules/fs-extra/lib/index.js"(exports, module2) {
    "use strict";
    module2.exports = {
      ...require_fs(),
      ...require_copy2(),
      ...require_empty(),
      ...require_ensure(),
      ...require_json(),
      ...require_mkdirs(),
      ...require_move2(),
      ...require_output_file(),
      ...require_path_exists(),
      ...require_remove()
    };
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  activate: () => activate,
  log: () => log
});
module.exports = __toCommonJS(src_exports);

// src/constants.ts
var import_coc = require("coc.nvim");
var import_fs_extra = __toESM(require_lib());
var import_path = require("path");
var _pkg = (0, import_fs_extra.readJsonSync)((0, import_path.resolve)("/home/hexh/workspace/coc-todo-tree/src", "../package.json"));
var _viewModes = _pkg.contributes.configuration.properties["todo-tree.defaultView"].enum;
var _extensionName = _pkg.name;
var _configuration = import_coc.workspace.getConfiguration().get("todo-tree");
var _configurationProperties = _pkg.contributes.configuration.properties;
var _defaultConfiguration = Object.keys(
  _configurationProperties
).reduce((obj, key) => {
  obj[key.replace(new RegExp(`${_extensionName.replace("coc-", "")}\\.`), "")] = _configurationProperties[key].default;
  return obj;
}, {});
var nextConfig = {};
if (_configuration && _configuration.tags) {
  nextConfig.tags = _configuration.tags.filter(
    (item, index, self) => self.findIndex((t) => t.tagName === item.tagName) === index
  );
}
var viewModes = _viewModes;
var extensionName = _extensionName;
var defaultConfiguration = _defaultConfiguration;
var configuration = { ..._configuration, ...nextConfig };

// src/tree.ts
var import_coc5 = require("coc.nvim");
var import_fs_extra4 = __toESM(require_lib());
var import_path2 = __toESM(require("path"));

// node_modules/vscode-uri/lib/esm/index.js
var LIB;
(() => {
  "use strict";
  var t = { 470: (t2) => {
    function e2(t3) {
      if ("string" != typeof t3)
        throw new TypeError("Path must be a string. Received " + JSON.stringify(t3));
    }
    function r2(t3, e3) {
      for (var r3, n3 = "", o = 0, i = -1, a = 0, h = 0; h <= t3.length; ++h) {
        if (h < t3.length)
          r3 = t3.charCodeAt(h);
        else {
          if (47 === r3)
            break;
          r3 = 47;
        }
        if (47 === r3) {
          if (i === h - 1 || 1 === a)
            ;
          else if (i !== h - 1 && 2 === a) {
            if (n3.length < 2 || 2 !== o || 46 !== n3.charCodeAt(n3.length - 1) || 46 !== n3.charCodeAt(n3.length - 2)) {
              if (n3.length > 2) {
                var s = n3.lastIndexOf("/");
                if (s !== n3.length - 1) {
                  -1 === s ? (n3 = "", o = 0) : o = (n3 = n3.slice(0, s)).length - 1 - n3.lastIndexOf("/"), i = h, a = 0;
                  continue;
                }
              } else if (2 === n3.length || 1 === n3.length) {
                n3 = "", o = 0, i = h, a = 0;
                continue;
              }
            }
            e3 && (n3.length > 0 ? n3 += "/.." : n3 = "..", o = 2);
          } else
            n3.length > 0 ? n3 += "/" + t3.slice(i + 1, h) : n3 = t3.slice(i + 1, h), o = h - i - 1;
          i = h, a = 0;
        } else
          46 === r3 && -1 !== a ? ++a : a = -1;
      }
      return n3;
    }
    var n2 = { resolve: function() {
      for (var t3, n3 = "", o = false, i = arguments.length - 1; i >= -1 && !o; i--) {
        var a;
        i >= 0 ? a = arguments[i] : (void 0 === t3 && (t3 = process.cwd()), a = t3), e2(a), 0 !== a.length && (n3 = a + "/" + n3, o = 47 === a.charCodeAt(0));
      }
      return n3 = r2(n3, !o), o ? n3.length > 0 ? "/" + n3 : "/" : n3.length > 0 ? n3 : ".";
    }, normalize: function(t3) {
      if (e2(t3), 0 === t3.length)
        return ".";
      var n3 = 47 === t3.charCodeAt(0), o = 47 === t3.charCodeAt(t3.length - 1);
      return 0 !== (t3 = r2(t3, !n3)).length || n3 || (t3 = "."), t3.length > 0 && o && (t3 += "/"), n3 ? "/" + t3 : t3;
    }, isAbsolute: function(t3) {
      return e2(t3), t3.length > 0 && 47 === t3.charCodeAt(0);
    }, join: function() {
      if (0 === arguments.length)
        return ".";
      for (var t3, r3 = 0; r3 < arguments.length; ++r3) {
        var o = arguments[r3];
        e2(o), o.length > 0 && (void 0 === t3 ? t3 = o : t3 += "/" + o);
      }
      return void 0 === t3 ? "." : n2.normalize(t3);
    }, relative: function(t3, r3) {
      if (e2(t3), e2(r3), t3 === r3)
        return "";
      if ((t3 = n2.resolve(t3)) === (r3 = n2.resolve(r3)))
        return "";
      for (var o = 1; o < t3.length && 47 === t3.charCodeAt(o); ++o)
        ;
      for (var i = t3.length, a = i - o, h = 1; h < r3.length && 47 === r3.charCodeAt(h); ++h)
        ;
      for (var s = r3.length - h, c = a < s ? a : s, f = -1, u = 0; u <= c; ++u) {
        if (u === c) {
          if (s > c) {
            if (47 === r3.charCodeAt(h + u))
              return r3.slice(h + u + 1);
            if (0 === u)
              return r3.slice(h + u);
          } else
            a > c && (47 === t3.charCodeAt(o + u) ? f = u : 0 === u && (f = 0));
          break;
        }
        var l = t3.charCodeAt(o + u);
        if (l !== r3.charCodeAt(h + u))
          break;
        47 === l && (f = u);
      }
      var p = "";
      for (u = o + f + 1; u <= i; ++u)
        u !== i && 47 !== t3.charCodeAt(u) || (0 === p.length ? p += ".." : p += "/..");
      return p.length > 0 ? p + r3.slice(h + f) : (h += f, 47 === r3.charCodeAt(h) && ++h, r3.slice(h));
    }, _makeLong: function(t3) {
      return t3;
    }, dirname: function(t3) {
      if (e2(t3), 0 === t3.length)
        return ".";
      for (var r3 = t3.charCodeAt(0), n3 = 47 === r3, o = -1, i = true, a = t3.length - 1; a >= 1; --a)
        if (47 === (r3 = t3.charCodeAt(a))) {
          if (!i) {
            o = a;
            break;
          }
        } else
          i = false;
      return -1 === o ? n3 ? "/" : "." : n3 && 1 === o ? "//" : t3.slice(0, o);
    }, basename: function(t3, r3) {
      if (void 0 !== r3 && "string" != typeof r3)
        throw new TypeError('"ext" argument must be a string');
      e2(t3);
      var n3, o = 0, i = -1, a = true;
      if (void 0 !== r3 && r3.length > 0 && r3.length <= t3.length) {
        if (r3.length === t3.length && r3 === t3)
          return "";
        var h = r3.length - 1, s = -1;
        for (n3 = t3.length - 1; n3 >= 0; --n3) {
          var c = t3.charCodeAt(n3);
          if (47 === c) {
            if (!a) {
              o = n3 + 1;
              break;
            }
          } else
            -1 === s && (a = false, s = n3 + 1), h >= 0 && (c === r3.charCodeAt(h) ? -1 == --h && (i = n3) : (h = -1, i = s));
        }
        return o === i ? i = s : -1 === i && (i = t3.length), t3.slice(o, i);
      }
      for (n3 = t3.length - 1; n3 >= 0; --n3)
        if (47 === t3.charCodeAt(n3)) {
          if (!a) {
            o = n3 + 1;
            break;
          }
        } else
          -1 === i && (a = false, i = n3 + 1);
      return -1 === i ? "" : t3.slice(o, i);
    }, extname: function(t3) {
      e2(t3);
      for (var r3 = -1, n3 = 0, o = -1, i = true, a = 0, h = t3.length - 1; h >= 0; --h) {
        var s = t3.charCodeAt(h);
        if (47 !== s)
          -1 === o && (i = false, o = h + 1), 46 === s ? -1 === r3 ? r3 = h : 1 !== a && (a = 1) : -1 !== r3 && (a = -1);
        else if (!i) {
          n3 = h + 1;
          break;
        }
      }
      return -1 === r3 || -1 === o || 0 === a || 1 === a && r3 === o - 1 && r3 === n3 + 1 ? "" : t3.slice(r3, o);
    }, format: function(t3) {
      if (null === t3 || "object" != typeof t3)
        throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof t3);
      return function(t4, e3) {
        var r3 = e3.dir || e3.root, n3 = e3.base || (e3.name || "") + (e3.ext || "");
        return r3 ? r3 === e3.root ? r3 + n3 : r3 + "/" + n3 : n3;
      }(0, t3);
    }, parse: function(t3) {
      e2(t3);
      var r3 = { root: "", dir: "", base: "", ext: "", name: "" };
      if (0 === t3.length)
        return r3;
      var n3, o = t3.charCodeAt(0), i = 47 === o;
      i ? (r3.root = "/", n3 = 1) : n3 = 0;
      for (var a = -1, h = 0, s = -1, c = true, f = t3.length - 1, u = 0; f >= n3; --f)
        if (47 !== (o = t3.charCodeAt(f)))
          -1 === s && (c = false, s = f + 1), 46 === o ? -1 === a ? a = f : 1 !== u && (u = 1) : -1 !== a && (u = -1);
        else if (!c) {
          h = f + 1;
          break;
        }
      return -1 === a || -1 === s || 0 === u || 1 === u && a === s - 1 && a === h + 1 ? -1 !== s && (r3.base = r3.name = 0 === h && i ? t3.slice(1, s) : t3.slice(h, s)) : (0 === h && i ? (r3.name = t3.slice(1, a), r3.base = t3.slice(1, s)) : (r3.name = t3.slice(h, a), r3.base = t3.slice(h, s)), r3.ext = t3.slice(a, s)), h > 0 ? r3.dir = t3.slice(0, h - 1) : i && (r3.dir = "/"), r3;
    }, sep: "/", delimiter: ":", win32: null, posix: null };
    n2.posix = n2, t2.exports = n2;
  } }, e = {};
  function r(n2) {
    var o = e[n2];
    if (void 0 !== o)
      return o.exports;
    var i = e[n2] = { exports: {} };
    return t[n2](i, i.exports, r), i.exports;
  }
  r.d = (t2, e2) => {
    for (var n2 in e2)
      r.o(e2, n2) && !r.o(t2, n2) && Object.defineProperty(t2, n2, { enumerable: true, get: e2[n2] });
  }, r.o = (t2, e2) => Object.prototype.hasOwnProperty.call(t2, e2), r.r = (t2) => {
    "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(t2, "__esModule", { value: true });
  };
  var n = {};
  (() => {
    var t2;
    if (r.r(n), r.d(n, { URI: () => p, Utils: () => _ }), "object" == typeof process)
      t2 = "win32" === process.platform;
    else if ("object" == typeof navigator) {
      var e2 = navigator.userAgent;
      t2 = e2.indexOf("Windows") >= 0;
    }
    var o, i, a = (o = function(t3, e3) {
      return o = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(t4, e4) {
        t4.__proto__ = e4;
      } || function(t4, e4) {
        for (var r2 in e4)
          Object.prototype.hasOwnProperty.call(e4, r2) && (t4[r2] = e4[r2]);
      }, o(t3, e3);
    }, function(t3, e3) {
      if ("function" != typeof e3 && null !== e3)
        throw new TypeError("Class extends value " + String(e3) + " is not a constructor or null");
      function r2() {
        this.constructor = t3;
      }
      o(t3, e3), t3.prototype = null === e3 ? Object.create(e3) : (r2.prototype = e3.prototype, new r2());
    }), h = /^\w[\w\d+.-]*$/, s = /^\//, c = /^\/\//, f = "", u = "/", l = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/, p = function() {
      function e3(t3, e4, r2, n2, o2, i2) {
        void 0 === i2 && (i2 = false), "object" == typeof t3 ? (this.scheme = t3.scheme || f, this.authority = t3.authority || f, this.path = t3.path || f, this.query = t3.query || f, this.fragment = t3.fragment || f) : (this.scheme = function(t4, e5) {
          return t4 || e5 ? t4 : "file";
        }(t3, i2), this.authority = e4 || f, this.path = function(t4, e5) {
          switch (t4) {
            case "https":
            case "http":
            case "file":
              e5 ? e5[0] !== u && (e5 = u + e5) : e5 = u;
          }
          return e5;
        }(this.scheme, r2 || f), this.query = n2 || f, this.fragment = o2 || f, function(t4, e5) {
          if (!t4.scheme && e5)
            throw new Error('[UriError]: Scheme is missing: {scheme: "", authority: "'.concat(t4.authority, '", path: "').concat(t4.path, '", query: "').concat(t4.query, '", fragment: "').concat(t4.fragment, '"}'));
          if (t4.scheme && !h.test(t4.scheme))
            throw new Error("[UriError]: Scheme contains illegal characters.");
          if (t4.path) {
            if (t4.authority) {
              if (!s.test(t4.path))
                throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character');
            } else if (c.test(t4.path))
              throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")');
          }
        }(this, i2));
      }
      return e3.isUri = function(t3) {
        return t3 instanceof e3 || !!t3 && "string" == typeof t3.authority && "string" == typeof t3.fragment && "string" == typeof t3.path && "string" == typeof t3.query && "string" == typeof t3.scheme && "string" == typeof t3.fsPath && "function" == typeof t3.with && "function" == typeof t3.toString;
      }, Object.defineProperty(e3.prototype, "fsPath", { get: function() {
        return b(this, false);
      }, enumerable: false, configurable: true }), e3.prototype.with = function(t3) {
        if (!t3)
          return this;
        var e4 = t3.scheme, r2 = t3.authority, n2 = t3.path, o2 = t3.query, i2 = t3.fragment;
        return void 0 === e4 ? e4 = this.scheme : null === e4 && (e4 = f), void 0 === r2 ? r2 = this.authority : null === r2 && (r2 = f), void 0 === n2 ? n2 = this.path : null === n2 && (n2 = f), void 0 === o2 ? o2 = this.query : null === o2 && (o2 = f), void 0 === i2 ? i2 = this.fragment : null === i2 && (i2 = f), e4 === this.scheme && r2 === this.authority && n2 === this.path && o2 === this.query && i2 === this.fragment ? this : new d(e4, r2, n2, o2, i2);
      }, e3.parse = function(t3, e4) {
        void 0 === e4 && (e4 = false);
        var r2 = l.exec(t3);
        return r2 ? new d(r2[2] || f, x(r2[4] || f), x(r2[5] || f), x(r2[7] || f), x(r2[9] || f), e4) : new d(f, f, f, f, f);
      }, e3.file = function(e4) {
        var r2 = f;
        if (t2 && (e4 = e4.replace(/\\/g, u)), e4[0] === u && e4[1] === u) {
          var n2 = e4.indexOf(u, 2);
          -1 === n2 ? (r2 = e4.substring(2), e4 = u) : (r2 = e4.substring(2, n2), e4 = e4.substring(n2) || u);
        }
        return new d("file", r2, e4, f, f);
      }, e3.from = function(t3) {
        return new d(t3.scheme, t3.authority, t3.path, t3.query, t3.fragment);
      }, e3.prototype.toString = function(t3) {
        return void 0 === t3 && (t3 = false), C(this, t3);
      }, e3.prototype.toJSON = function() {
        return this;
      }, e3.revive = function(t3) {
        if (t3) {
          if (t3 instanceof e3)
            return t3;
          var r2 = new d(t3);
          return r2._formatted = t3.external, r2._fsPath = t3._sep === g ? t3.fsPath : null, r2;
        }
        return t3;
      }, e3;
    }(), g = t2 ? 1 : void 0, d = function(t3) {
      function e3() {
        var e4 = null !== t3 && t3.apply(this, arguments) || this;
        return e4._formatted = null, e4._fsPath = null, e4;
      }
      return a(e3, t3), Object.defineProperty(e3.prototype, "fsPath", { get: function() {
        return this._fsPath || (this._fsPath = b(this, false)), this._fsPath;
      }, enumerable: false, configurable: true }), e3.prototype.toString = function(t4) {
        return void 0 === t4 && (t4 = false), t4 ? C(this, true) : (this._formatted || (this._formatted = C(this, false)), this._formatted);
      }, e3.prototype.toJSON = function() {
        var t4 = { $mid: 1 };
        return this._fsPath && (t4.fsPath = this._fsPath, t4._sep = g), this._formatted && (t4.external = this._formatted), this.path && (t4.path = this.path), this.scheme && (t4.scheme = this.scheme), this.authority && (t4.authority = this.authority), this.query && (t4.query = this.query), this.fragment && (t4.fragment = this.fragment), t4;
      }, e3;
    }(p), v = ((i = {})[58] = "%3A", i[47] = "%2F", i[63] = "%3F", i[35] = "%23", i[91] = "%5B", i[93] = "%5D", i[64] = "%40", i[33] = "%21", i[36] = "%24", i[38] = "%26", i[39] = "%27", i[40] = "%28", i[41] = "%29", i[42] = "%2A", i[43] = "%2B", i[44] = "%2C", i[59] = "%3B", i[61] = "%3D", i[32] = "%20", i);
    function y(t3, e3) {
      for (var r2 = void 0, n2 = -1, o2 = 0; o2 < t3.length; o2++) {
        var i2 = t3.charCodeAt(o2);
        if (i2 >= 97 && i2 <= 122 || i2 >= 65 && i2 <= 90 || i2 >= 48 && i2 <= 57 || 45 === i2 || 46 === i2 || 95 === i2 || 126 === i2 || e3 && 47 === i2)
          -1 !== n2 && (r2 += encodeURIComponent(t3.substring(n2, o2)), n2 = -1), void 0 !== r2 && (r2 += t3.charAt(o2));
        else {
          void 0 === r2 && (r2 = t3.substr(0, o2));
          var a2 = v[i2];
          void 0 !== a2 ? (-1 !== n2 && (r2 += encodeURIComponent(t3.substring(n2, o2)), n2 = -1), r2 += a2) : -1 === n2 && (n2 = o2);
        }
      }
      return -1 !== n2 && (r2 += encodeURIComponent(t3.substring(n2))), void 0 !== r2 ? r2 : t3;
    }
    function m(t3) {
      for (var e3 = void 0, r2 = 0; r2 < t3.length; r2++) {
        var n2 = t3.charCodeAt(r2);
        35 === n2 || 63 === n2 ? (void 0 === e3 && (e3 = t3.substr(0, r2)), e3 += v[n2]) : void 0 !== e3 && (e3 += t3[r2]);
      }
      return void 0 !== e3 ? e3 : t3;
    }
    function b(e3, r2) {
      var n2;
      return n2 = e3.authority && e3.path.length > 1 && "file" === e3.scheme ? "//".concat(e3.authority).concat(e3.path) : 47 === e3.path.charCodeAt(0) && (e3.path.charCodeAt(1) >= 65 && e3.path.charCodeAt(1) <= 90 || e3.path.charCodeAt(1) >= 97 && e3.path.charCodeAt(1) <= 122) && 58 === e3.path.charCodeAt(2) ? r2 ? e3.path.substr(1) : e3.path[1].toLowerCase() + e3.path.substr(2) : e3.path, t2 && (n2 = n2.replace(/\//g, "\\")), n2;
    }
    function C(t3, e3) {
      var r2 = e3 ? m : y, n2 = "", o2 = t3.scheme, i2 = t3.authority, a2 = t3.path, h2 = t3.query, s2 = t3.fragment;
      if (o2 && (n2 += o2, n2 += ":"), (i2 || "file" === o2) && (n2 += u, n2 += u), i2) {
        var c2 = i2.indexOf("@");
        if (-1 !== c2) {
          var f2 = i2.substr(0, c2);
          i2 = i2.substr(c2 + 1), -1 === (c2 = f2.indexOf(":")) ? n2 += r2(f2, false) : (n2 += r2(f2.substr(0, c2), false), n2 += ":", n2 += r2(f2.substr(c2 + 1), false)), n2 += "@";
        }
        -1 === (c2 = (i2 = i2.toLowerCase()).indexOf(":")) ? n2 += r2(i2, false) : (n2 += r2(i2.substr(0, c2), false), n2 += i2.substr(c2));
      }
      if (a2) {
        if (a2.length >= 3 && 47 === a2.charCodeAt(0) && 58 === a2.charCodeAt(2))
          (l2 = a2.charCodeAt(1)) >= 65 && l2 <= 90 && (a2 = "/".concat(String.fromCharCode(l2 + 32), ":").concat(a2.substr(3)));
        else if (a2.length >= 2 && 58 === a2.charCodeAt(1)) {
          var l2;
          (l2 = a2.charCodeAt(0)) >= 65 && l2 <= 90 && (a2 = "".concat(String.fromCharCode(l2 + 32), ":").concat(a2.substr(2)));
        }
        n2 += r2(a2, true);
      }
      return h2 && (n2 += "?", n2 += r2(h2, false)), s2 && (n2 += "#", n2 += e3 ? s2 : y(s2, false)), n2;
    }
    function A(t3) {
      try {
        return decodeURIComponent(t3);
      } catch (e3) {
        return t3.length > 3 ? t3.substr(0, 3) + A(t3.substr(3)) : t3;
      }
    }
    var w = /(%[0-9A-Za-z][0-9A-Za-z])+/g;
    function x(t3) {
      return t3.match(w) ? t3.replace(w, function(t4) {
        return A(t4);
      }) : t3;
    }
    var _, O = r(470), P = function(t3, e3, r2) {
      if (r2 || 2 === arguments.length)
        for (var n2, o2 = 0, i2 = e3.length; o2 < i2; o2++)
          !n2 && o2 in e3 || (n2 || (n2 = Array.prototype.slice.call(e3, 0, o2)), n2[o2] = e3[o2]);
      return t3.concat(n2 || Array.prototype.slice.call(e3));
    }, j = O.posix || O, U = "/";
    !function(t3) {
      t3.joinPath = function(t4) {
        for (var e3 = [], r2 = 1; r2 < arguments.length; r2++)
          e3[r2 - 1] = arguments[r2];
        return t4.with({ path: j.join.apply(j, P([t4.path], e3, false)) });
      }, t3.resolvePath = function(t4) {
        for (var e3 = [], r2 = 1; r2 < arguments.length; r2++)
          e3[r2 - 1] = arguments[r2];
        var n2 = t4.path, o2 = false;
        n2[0] !== U && (n2 = U + n2, o2 = true);
        var i2 = j.resolve.apply(j, P([n2], e3, false));
        return o2 && i2[0] === U && !t4.authority && (i2 = i2.substring(1)), t4.with({ path: i2 });
      }, t3.dirname = function(t4) {
        if (0 === t4.path.length || t4.path === U)
          return t4;
        var e3 = j.dirname(t4.path);
        return 1 === e3.length && 46 === e3.charCodeAt(0) && (e3 = ""), t4.with({ path: e3 });
      }, t3.basename = function(t4) {
        return j.basename(t4.path);
      }, t3.extname = function(t4) {
        return j.extname(t4.path);
      };
    }(_ || (_ = {}));
  })(), LIB = n;
})();
var { URI, Utils } = LIB;

// src/grep.ts
var import_child_process = require("child_process");
var import_readline = __toESM(require("readline"));
var import_coc3 = require("coc.nvim");

// src/helpers.ts
var import_coc2 = require("coc.nvim");
var import_fs_extra2 = __toESM(require_lib());
var logger = {
  warn: log("warn"),
  info: log("info"),
  error: log("info")
};
function showErrorMessage(message, showFloatingWin = false) {
  import_coc2.window.showErrorMessage(message);
  if (showFloatingWin) {
    import_coc2.window.showNotification({
      kind: "error",
      title: extensionName,
      content: message
    });
  }
  logger.error(message);
}
function showWarningMessage(message, showFloatingWin = false) {
  import_coc2.window.showWarningMessage(message);
  if (showFloatingWin) {
    import_coc2.window.showNotification({
      kind: "warning",
      title: extensionName,
      content: message
    });
  }
  logger.warn(message);
}
var isFile = (path2) => (0, import_fs_extra2.existsSync)(path2) && (0, import_fs_extra2.lstatSync)(path2).isFile();
var removeCWD = (path2) => path2.replace(import_coc2.workspace.cwd + "/", "");
async function registerRuntimepath(extensionPath) {
  const { nvim } = import_coc2.workspace;
  const rtp = await nvim.getOption("runtimepath");
  const paths = rtp.split(",");
  if (!paths.includes(extensionPath)) {
    await nvim.command(
      `execute 'noa set rtp+='.fnameescape('${extensionPath.replace(
        /'/g,
        "''"
      )}')`
    );
  }
}

// src/view.ts
var View = class {
  constructor() {
    this._tagsOnlyView = new Map(
      configuration.tags.map((item) => [item.tagName, []])
    );
    this._flatView = /* @__PURE__ */ new Map();
    this._treeView = /* @__PURE__ */ new Map();
    this.mode = configuration.defaultView;
    this.groupByTag = configuration.groupByTag;
  }
  flatView(grepItem) {
    const fsPath = grepItem.fsPath;
    const tag = {
      index: grepItem.index,
      tagName: grepItem.tagName
    };
    if (this._flatView.has(fsPath)) {
      this._flatView.get(fsPath).push(tag);
    } else {
      this._flatView.set(fsPath, [tag]);
    }
    return this._flatView;
  }
  tagsOnlyView(grepItem) {
    const currentTagName = grepItem.tagName;
    const currentIndex = grepItem.index;
    if (this._tagsOnlyView.has(currentTagName)) {
      this._tagsOnlyView.get(currentTagName).push(currentIndex);
    } else {
      this._tagsOnlyView.set(currentTagName, [currentIndex]);
    }
    return this._tagsOnlyView;
  }
  treeView(grepItem) {
    const { tagName, index, fsPath } = grepItem;
    const pathArr = fsPath.split("/").filter((i) => i);
    let target = this._treeView;
    pathArr.forEach((path2, order, self) => {
      const next = target.get(path2);
      if (!self[order + 1]) {
        const item = { tagName, index };
        const next2 = target.get(path2);
        if (Array.isArray(next2)) {
          next2.push(item);
        } else {
          const newArr = [item];
          target.set(path2, newArr);
          target = newArr;
        }
      } else if (!next) {
        const newMap = /* @__PURE__ */ new Map();
        target.set(path2, newMap);
        target = newMap;
      } else if (next) {
        target = next;
      }
    });
    return this._treeView;
  }
  generateView(grepItem) {
    this.treeView(grepItem);
    this.flatView(grepItem);
    this.tagsOnlyView(grepItem);
  }
  clear() {
    this._treeView.clear();
    this._tagsOnlyView.clear();
    this._flatView.clear();
  }
  get data() {
    const data = this[`_${this.mode}View`];
    const dataType = Object.prototype.toString.call(data);
    let valid = false;
    switch (dataType) {
      case "[object Map]": {
        valid = data.size !== 0;
        break;
      }
      default:
      case "[object Array]": {
        valid = data.length !== 0;
        break;
      }
    }
    if (valid) {
      return this[`_${this.mode}View`];
    }
    return null;
  }
  switchToNextMode() {
    var _a;
    const index = viewModes.findIndex((mode) => mode === this.mode);
    if (index !== -1) {
      this.mode = (_a = viewModes[index + 1]) != null ? _a : viewModes[0];
    } else {
      this.mode = viewModes[1];
    }
  }
};
var view = new View();
var view_default = view;

// src/grep.ts
var maxGrepColumns = configuration.maxGrepColumns;
var maxPreviewWidth = configuration.maxPreviewWidth || maxGrepColumns;
var customCommand = configuration.customCommand;
var Grep = class {
  constructor(options) {
    this.cwd = import_coc3.workspace.cwd;
    this.currentProcess = null;
    this.resArr = [];
    this.grep = () => {
      return new Promise((resolve2) => {
        const cmds = this.grepString.split(" ");
        this.currentProcess = (0, import_child_process.spawn)(cmds[0], cmds.slice(1), {
          cwd: this.cwd
        });
        this.currentProcess.on("error", (e) => {
          showErrorMessage(e.message);
        });
        this.currentProcess.stderr.on("data", (chunk) => {
          showErrorMessage(chunk.toString("utf8"));
        });
        const rl = import_readline.default.createInterface(this.currentProcess.stdout);
        rl.on("line", (line) => {
          if (line) {
            const res = getRes(line);
            if (res.shortText && testFilePath(res.fsPath)) {
              res.tagName = this.options.tagName;
              res.index = this.resArr.length;
              view_default.generateView(res);
              this.resArr.push(res);
            }
          }
        });
        rl.on("close", () => {
          resolve2(this.resArr);
          if (this.currentProcess && !this.currentProcess.killed) {
            this.currentProcess.kill();
          }
        });
      });
    };
    this.options = options;
    this.grepString = this.genGrepString();
  }
  genGrepString() {
    if (this.options.regex) {
      return (customCommand || `rg --no-messages --vimgrep -H --column --max-columns ${maxGrepColumns} --max-columns-preview --line-number --color never -e`) + ` ${this.options.regex} -- ${import_coc3.workspace.cwd}`;
    }
    return 'echo ""';
  }
  handleGrepCancel() {
    if (this.currentProcess && !this.currentProcess.killed) {
      this.currentProcess.kill();
      return this.resArr;
    }
    return [];
  }
};
var grep_default = Grep;
function testFilePath(filePath) {
  const rs = configuration.filterFilesRegex;
  if (Array.isArray(rs)) {
    return !rs.some((r) => {
      const reg = new RegExp(r);
      return reg.test(filePath);
    });
  }
  return true;
}
function getRes(matchText) {
  var _a, _b;
  const regex = RegExp(/^(?<file>.*):(?<line>\d+):(?<column>\d+):(?<tag>.*)/);
  let fsPath;
  let line;
  let column;
  let detail;
  const regMatch = regex.exec(matchText);
  if (regMatch && regMatch.groups) {
    fsPath = regMatch.groups.file;
    line = parseInt(regMatch.groups.line);
    column = parseInt(regMatch.groups.column);
    detail = regMatch.groups.tag;
  } else {
    fsPath = "";
    if (matchText.length > 1 && matchText[1] === ":") {
      fsPath = matchText.substring(0, 2);
      matchText = matchText.substring(2);
    }
    const parts = matchText.split(":");
    const hasColumn = parts.length === 4;
    fsPath += parts.shift();
    line = parseInt((_a = parts.shift()) != null ? _a : "");
    if (hasColumn === true) {
      column = parseInt((_b = parts.shift()) != null ? _b : "");
    } else {
      column = 1;
    }
    detail = parts.join(":");
  }
  const shortTextArr = [];
  detail = Array.from(
    { length: Math.min(maxPreviewWidth, detail.length, maxGrepColumns) },
    (_, i) => i + (column - 1)
  ).map((i, index) => {
    if (index < 40)
      shortTextArr.push(detail[i]);
    return detail[i];
  }).join("");
  const shortText = shortTextArr.join("");
  return {
    tagName: "",
    detail,
    shortText: /\[\.\.\.\u0020\d+\u0020more\u0020matches\]/.test(detail) ? "" : shortText,
    line,
    fsPath,
    column
  };
}

// src/list/flat/with-group.ts
function listFlatWithGroup(results) {
  const parents = [];
  const data = view_default.data;
  const configTags = configuration.tags.map((t) => t.tagName);
  if (data && Array.isArray(configTags) && configTags.length) {
    configTags.forEach((tName) => {
      const result = results.find((result2) => {
        var _a;
        return ((_a = result2[0]) == null ? void 0 : _a.tagName) === tName;
      });
      if (result) {
        parents.push({
          level: 0,
          key: tName,
          tag: tName,
          sourcePath: tName,
          children: Array.from(data.keys()).reduce((total, sourcePath) => {
            const tags = data.get(sourcePath);
            const targets = tags.filter((t) => t.tagName === tName);
            const next = {
              level: 1,
              sourcePath,
              key: `${tName}.${sourcePath}`,
              children: targets.map((target) => result[target.index])
            };
            if (next.children.length) {
              total.push(next);
            }
            return total;
          }, []).sort((a, b) => a.sourcePath.localeCompare(b.sourcePath))
        });
      }
    });
  }
  return parents;
}

// src/list/flat/without-group.ts
function listFlatWithoutGroup(results) {
  const parents = [];
  const data = view_default.data;
  if (data) {
    data.forEach((tags, path2) => {
      parents.push({
        level: 0,
        key: path2,
        sourcePath: path2,
        children: tags.reduce((total, tag) => {
          const result = results.find((result2) => {
            var _a;
            return ((_a = result2[0]) == null ? void 0 : _a.tagName) === tag.tagName;
          });
          if (result) {
            total.push(result[tag.index]);
          }
          return total;
        }, [])
      });
    });
  }
  return parents.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
}

// src/list/tags-only/with-group.ts
function listTagsOnlyWithGroup(results) {
  const parents = results.reduce((total, current) => {
    if (Array.isArray(current) && current.length > 0) {
      const tagName = current[0].tagName;
      total.push({
        level: 0,
        tag: tagName,
        key: tagName,
        sourcePath: tagName,
        children: current.map((i) => {
          if (!isParent(i)) {
            return {
              ...i,
              extra: `${removeCWD(i.path)}: ${i.range.start.line}, ${i.range.start.character}`
            };
          }
          return i;
        })
      });
    }
    return total;
  }, []);
  return parents;
}

// src/list/tags-only/without-group.ts
function listTagsOnlyWithoutGroup(results) {
  const items = results.reduce((total, current) => {
    total.push(
      ...current.map((i) => {
        if (!isParent(i)) {
          return {
            ...i,
            extra: `${removeCWD(i.path)}: ${i.range.start.line}, ${i.range.start.character}`
          };
        }
        return i;
      })
    );
    return total;
  }, []);
  return items;
}

// src/list/tree/helpers.ts
var import_coc4 = require("coc.nvim");
var import_fs_extra3 = __toESM(require_lib());
var getParentPath = (parentPaths, total) => {
  const _parentPaths = parentPaths ? clone(parentPaths).reverse() : [];
  const parent = clone(total).reverse().find((i) => _parentPaths.includes(i.sourcePath));
  if (parent) {
    return parent.sourcePath;
  }
  return null;
};
function deleteEmpty(treeData) {
  function traversal(node) {
    for (let i = 0; i < node.length; i++) {
      const info = node[i];
      if (isParent(info)) {
        if (info.children.length > 0) {
          traversal(info.children);
        }
        if (info.children.length === 0) {
          const index = node.findIndex((i2) => isParent(i2) && info.key === i2.key);
          node.splice(index, 1);
          i--;
        }
      }
    }
  }
  traversal(treeData);
}
function clone(data) {
  return JSON.parse(JSON.stringify(data));
}
var buildTree = (data) => data.map(
  (t) => t.sourcePath === import_coc4.workspace.cwd ? { ...t, parentPaths: null } : t
).sort((a, b) => a.level - b.level).reduce(
  (m, { sourcePath, parentPaths, children, ...rest }) => {
    var _a;
    return m.get(getParentPath(parentPaths, data)).push({
      ...rest,
      sourcePath,
      name: sourcePath.replace(
        ((_a = getParentPath(parentPaths, data)) != null ? _a : import_coc4.workspace.cwd) + "/",
        ""
      ),
      children: isFile(sourcePath) ? children : m.set(sourcePath, []).get(sourcePath)
    }), m;
  },
  /* @__PURE__ */ new Map([[null, []]])
).get(null).reduce((total, current, currentIndex) => {
  if (currentIndex === 0 && current.sourcePath === import_coc4.workspace.cwd) {
    total = current.children;
  }
  return total;
}, []);
var handleSingleChidren = (arr) => {
  return arr.reduce((total, current) => {
    if (isParent(current)) {
      if ((0, import_fs_extra3.existsSync)(current.sourcePath) && (0, import_fs_extra3.lstatSync)(current.sourcePath).isFile() || current.children.length > 1) {
        total.push(current);
      }
    }
    return total;
  }, []);
};
var flatten = (next, parentPaths = []) => {
  return Array.prototype.concat.apply(
    next.map((i) => i).reduce((total, current) => {
      if (current) {
        total.push({ ...current, parentPaths });
      }
      return total;
    }, []),
    next.map(
      (i) => isParent(i) ? flatten(i.children, [...parentPaths, i.sourcePath]) : []
    )
  );
};

// src/list/tree/with-group.ts
function listTreeWithGroup(results) {
  const parents = [];
  const configTags = configuration.tags.map((t) => t.tagName);
  function _loopToArray(tag, t, level = 0, path2 = "") {
    let arr = [];
    if (Array.isArray(t)) {
      const targetIndex = results.findIndex((item) => {
        var _a;
        return ((_a = item[0]) == null ? void 0 : _a.tagName) === tag;
      });
      if (targetIndex !== -1) {
        arr = results[targetIndex].filter((i) => i.path === `${path2}`);
      }
    } else {
      const nextLevel = level + 1;
      arr = Array.from(t.keys()).map((key) => {
        const nextTarget = t.get(key);
        const nextPath = `${path2}/${key}`;
        return {
          level: nextLevel,
          sourcePath: nextPath,
          key: `[${tag}] [${nextLevel}] ${nextPath}`,
          children: _loopToArray(tag, nextTarget, nextLevel, nextPath)
        };
      });
    }
    const res = arr.sort((a, b) => {
      if (isParent(a) && isParent(b)) {
        return a.sourcePath.localeCompare(b.sourcePath);
      }
      return 0;
    });
    deleteEmpty(res);
    return res;
  }
  configTags.forEach((configTag) => {
    const target = results.find((item) => {
      var _a;
      return ((_a = item[0]) == null ? void 0 : _a.tagName) === configTag;
    });
    if (target) {
      const children = buildTree(
        handleSingleChidren(flatten(_loopToArray(configTag, view_default.data)))
      );
      parents.push({
        level: 0,
        sourcePath: configTag,
        key: configTag,
        tag: configTag,
        children
      });
    }
  });
  return parents;
}

// src/list/tree/without-group.ts
function listTreeWithoutGroup(results) {
  function _recursive(obj, level = 0, path2 = "") {
    let res = [];
    if (Array.isArray(obj)) {
      configuration.tags.forEach(({ tagName: tag }) => {
        const indexArr = obj.filter((o) => o.tagName === tag);
        const targetResult = results.find((i) => {
          var _a;
          return ((_a = i[0]) == null ? void 0 : _a.tagName) === tag;
        });
        if (indexArr.length && !!targetResult) {
          const r = indexArr.map((i) => targetResult[i.index]).filter((i) => i.path === path2);
          res.push(...r);
        }
      });
    } else {
      res = Array.from(obj.keys()).map((key) => {
        const nextPath = `${path2}/${key}`;
        const nextTarget = obj.get(key);
        const children = _recursive(nextTarget, level + 1, nextPath).sort(
          (a, b) => {
            if (isParent(a) && isParent(b)) {
              return a.sourcePath.localeCompare(b.sourcePath);
            }
            return 0;
          }
        );
        return {
          level,
          sourcePath: nextPath,
          key: `[${level}] ${nextPath}`,
          children
        };
      });
    }
    return res;
  }
  const parents = buildTree(
    handleSingleChidren(flatten(view_default.data ? _recursive(view_default.data) : []))
  );
  return parents;
}

// src/list/index.ts
function listIt(pending) {
  if (view_default.groupByTag) {
    switch (view_default.mode) {
      case viewModes[0]:
        return listTagsOnlyWithGroup(pending);
      case viewModes[2]:
        return listTreeWithGroup(pending);
      default:
      case viewModes[1]:
        return listFlatWithGroup(pending);
    }
  } else {
    switch (view_default.mode) {
      case viewModes[0]:
        return listTagsOnlyWithoutGroup(pending);
      case viewModes[2]:
        return listTreeWithoutGroup(pending);
      default:
      case viewModes[1]:
        return listFlatWithoutGroup(pending);
    }
  }
}

// src/tree.ts
var TodoTree = class {
  constructor() {
    this.disposables = [];
    this.rootItems = [];
    this._treeView = null;
    this.opened = [];
    this.nvim = import_coc5.workspace.nvim;
    this.emitter = new import_coc5.Emitter();
    this.timeout = null;
    this.fetching = false;
    this.autoPreview = configuration.autoPreview;
    this.commandsMap = /* @__PURE__ */ new Map();
    this.autocmdsArr = Array();
    this.generateCommands();
    this.generateAutocmds();
  }
  get treeView() {
    if (!this._treeView) {
      this.generateTreeView();
    }
    return this._treeView;
  }
  set treeView(_next) {
  }
  generateCommands() {
    this.commandsMap.set(`showTree`, {
      callback: async () => {
        if (this.treeView && !this.treeView.visible) {
          this.autocmdsArr.map((autocmd) => {
            return import_coc5.events.on(
              autocmd.event,
              autocmd.callback,
              null,
              this.disposables
            );
          });
          const doc = await import_coc5.workspace.document;
          const bufnr = doc.bufnr;
          this.prevBufnr = await this.nvim.call("bufwinnr", [bufnr]);
          await this.treeView.show();
        }
        this.refreshTodoItems();
      },
      args: void 0
    }).set(`goTo`, {
      callback: (node) => jumpTo(node, this.nvim, this.prevBufnr),
      args: void 0,
      internal: true
    }).set(`open`, {
      callback: () => {
      },
      args: void 0,
      internal: true
    });
    return this.commandsMap;
  }
  generateAutocmds() {
    this.autocmdsArr.push({
      event: "BufWritePost",
      callback: () => {
        var _a;
        if ((_a = this.treeView) == null ? void 0 : _a.visible) {
          this.refreshTodoItems(500);
        }
      }
    });
    this.autocmdsArr.push({
      event: "BufEnter",
      callback: (bufnr) => {
        var _a;
        if (((_a = this._treeView) == null ? void 0 : _a.visible) && this.previewBufnr && bufnr !== this.previewBufnr) {
          this.prevNode = void 0;
          this.closePreview();
        }
      }
    });
    return this.autocmdsArr;
  }
  refreshTodoItems(timeout = 0) {
    if (this.fetching) {
      return;
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(async () => {
      const updateText = "Updating items...";
      await import_coc5.window.withProgress(
        {
          title: `[${extensionName}] ${updateText}`,
          cancellable: true
        },
        async (_, cancellationToken) => {
          let msgPrefix = "";
          this._treeView.nodesMap.clear();
          view_default.clear();
          this._treeView.message = msgPrefix;
          let all = 0;
          const gs = configuration.tags.map(
            (tag) => new grep_default({ regex: tag.regex, tagName: tag.tagName })
          );
          cancellationToken.onCancellationRequested(() => {
            const cancelText = "Grep canceled";
            msgPrefix = `${cancelText}: `;
            showWarningMessage(cancelText);
            const results = gs.map((g) => {
              all += g.resArr.length;
              return convertRawMatchesToTodoItem(g.handleGrepCancel());
            });
            this.rootItems = listIt(results);
          });
          return new Promise((resolve2) => {
            this.fetching = true;
            this.rootItems = [];
            msgPrefix = "All ";
            Promise.all(
              gs.map(async (g) => convertRawMatchesToTodoItem(await g.grep()))
            ).then((results) => {
              gs.forEach((g) => all += g.resArr.length);
              this._treeView.message = msgPrefix + `${all} items`;
              this._treeView.description = `${view_default.groupByTag ? "group by tag;" : ""} ${view_default.mode} view`;
              this.rootItems = listIt(results);
              resolve2();
            });
          });
        }
      );
      this.emitter.fire(void 0);
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      this.fetching = false;
    }, timeout);
  }
  generateTreeView() {
    const treeDataProvider = {
      resolveActions: async (_, node) => {
        return [
          {
            title: "open it and close tree",
            handler: async () => {
              const doc = await import_coc5.workspace.document;
              const bufnr = doc.bufnr;
              const winnr = await this.nvim.call("bufwinnr", [bufnr]);
              await jumpTo(node, this.nvim, this.prevBufnr);
              await this.nvim.command(`${winnr}wincmd c`);
            }
          }
        ];
      },
      onDidChangeTreeData: this.emitter.event,
      getChildren: (root) => {
        if (!root) {
          return this.rootItems;
        }
        if (isParent(root)) {
          return root.children;
        }
        return void 0;
      },
      getTreeItem: (node) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
        let item;
        if (isParent(node)) {
          let icon;
          let iconHLGroup;
          let description = "";
          const state = this.opened.findIndex((t) => t.key === node.key) !== -1 ? import_coc5.TreeItemCollapsibleState.Expanded : import_coc5.TreeItemCollapsibleState.Collapsed;
          let text = "";
          if (typeof node.tag === "string") {
            const target = configuration.tags.find(
              (t) => t.tagName === node.tag
            );
            if (target) {
              icon = (_a = target == null ? void 0 : target.icon) == null ? void 0 : _a.text;
              text = node.tag;
              iconHLGroup = ((_b = configuration) == null ? void 0 : _b.groupTagIconHighlight) || ((_c = target.icon) == null ? void 0 : _c.hlGroup);
            }
          } else {
            description = node.sourcePath.replace(import_coc5.workspace.cwd + "/", "");
            if ((0, import_fs_extra4.lstatSync)(node.sourcePath).isFile()) {
              icon = (_e = (_d = configuration) == null ? void 0 : _d.fileIcon) == null ? void 0 : _e.text;
              iconHLGroup = (_g = (_f = configuration) == null ? void 0 : _f.fileIcon) == null ? void 0 : _g.hlGroup;
            } else {
              icon = (_i = (_h = configuration) == null ? void 0 : _h.folderIcon) == null ? void 0 : _i.text;
              iconHLGroup = (_k = (_j = configuration) == null ? void 0 : _j.folderIcon) == null ? void 0 : _k.hlGroup;
            }
            const p = (_l = node.name) != null ? _l : import_path2.default.basename(URI.file(node.sourcePath).path);
            text = p;
          }
          item = new import_coc5.TreeItem(text, state);
          item.command = {
            command: `${extensionName}.open`,
            title: "open it",
            arguments: [node]
          };
          item.description = description;
          if (configuration.parentNodeHighlightEnabled) {
            item.label = {
              highlights: [[0, text.length]],
              label: text
            };
          }
          if (icon) {
            item.icon = {
              hlGroup: iconHLGroup || defaultConfiguration.fileIcon.hlGroup,
              text: icon
            };
          }
        } else {
          const { shortText } = node;
          const icon = (_m = configuration.tags.find(
            (t) => t.tagName === node.tagName
          )) == null ? void 0 : _m.icon;
          item = new import_coc5.TreeItem(`${shortText}`, import_coc5.TreeItemCollapsibleState.None);
          const position = (_n = node.extra) != null ? _n : `[${node.range.start.line}, ${node.range.start.character}]`;
          if (icon) {
            item.icon = {
              hlGroup: icon == null ? void 0 : icon.hlGroup,
              text: icon == null ? void 0 : icon.text
            };
          }
          item.command = {
            command: `${extensionName}.goTo`,
            title: "go to it",
            arguments: [node]
          };
          item.description = position;
        }
        return item;
      }
    };
    this._treeView = import_coc5.window.createTreeView("Todo", {
      treeDataProvider,
      bufhidden: "hide",
      autoWidth: true
    });
    this._treeView.onDidExpandElement(({ element }) => {
      if (isParent(element)) {
        const { key } = element;
        if (this.opened.find((t) => t.key === key)) {
          return;
        }
        this.opened.push({ key });
      }
    });
    this._treeView.onDidCollapseElement(({ element }) => {
      if (isParent(element)) {
        const { key } = element;
        const exist = this.opened.findIndex((t) => t.key === key);
        if (exist !== -1) {
          this.opened.splice(exist, 1);
        }
      }
    });
    this._treeView._collapseAll = this._treeView.collapseAll;
    this._treeView.collapseAll = (...args) => {
      this._treeView._collapseAll(...args);
      this.opened = [];
    };
    this._treeView.onDidChangeVisibility(({ visible }) => {
      if (!visible) {
        this.closePreview();
        (0, import_coc5.disposeAll)(this.disposables);
      }
    });
    this._treeView.registerLocalKeymap(
      "n",
      configuration.toggleGroupByTagKey,
      async () => {
        this.closePreview();
        view_default.groupByTag = !view_default.groupByTag;
        this.refreshTodoItems();
      },
      true
    );
    this._treeView.registerLocalKeymap(
      "n",
      configuration.refreshItemsKey,
      async () => {
        this.closePreview();
        this.refreshTodoItems();
      },
      true
    );
    this._treeView.registerLocalKeymap(
      "n",
      configuration.togglePreviewKey,
      async (node) => {
        this.autoPreview = !this.autoPreview;
        this.doPreview(node);
      },
      true
    );
    this._treeView.registerLocalKeymap(
      "n",
      configuration.switchViewKey,
      async () => {
        this.opened = [];
        view_default.switchToNextMode();
        this.closePreview();
        this.refreshTodoItems();
      },
      true
    );
    this._treeView.onDidCursorMoved(async (node) => {
      if (this.prevNode !== node) {
        this.prevNode = node;
        this.previewBufnr = await this.doPreview(node);
      }
    });
    return this._treeView;
  }
  async doPreview(node) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
    if (node && this.autoPreview) {
      const config = {
        lines: [],
        border: (_c = (_a = configuration.previewWinConfig) == null ? void 0 : _a.border) != null ? _c : (_b = defaultConfiguration.previewWinConfig) == null ? void 0 : _b.border,
        rounded: (_f = (_d = configuration.previewWinConfig) == null ? void 0 : _d.rounded) != null ? _f : (_e = defaultConfiguration.previewWinConfig) == null ? void 0 : _e.rounded,
        maxWidth: configuration.maxPreviewWidth,
        highlight: (_i = (_g = configuration.previewWinConfig) == null ? void 0 : _g.highlight) != null ? _i : (_h = defaultConfiguration.previewWinConfig) == null ? void 0 : _h.highlight,
        borderhighlight: (_l = (_j = configuration.previewWinConfig) == null ? void 0 : _j.borderhighlight) != null ? _l : (_k = defaultConfiguration.previewWinConfig) == null ? void 0 : _k.borderhighlight,
        winblend: (_o = (_m = configuration.previewWinConfig) == null ? void 0 : _m.winblend) != null ? _o : (_n = defaultConfiguration.previewWinConfig) == null ? void 0 : _n.winblend,
        filetype: "text"
      };
      if (isParent(node)) {
        if (node.tag) {
          this.closePreview();
          return;
        } else {
          config.lines.push(node.sourcePath.replace(import_coc5.workspace.cwd + "/", ""));
        }
        config.maxWidth = 1e3;
      } else if (!isParent(node)) {
        const position = (_p = node.extra) != null ? _p : `[Line ${node.range.start.line}, Col ${node.range.start.character}]`;
        const text = `${node.detail}

${position}`;
        config.lines = (text == null ? void 0 : text.split("\n")) || [];
      }
      return await this.nvim.call("coc_todo_tree#preview", config);
    } else {
      this.closePreview();
    }
  }
  closePreview() {
    this.nvim.call("coc_todo_tree#close_preview", [], true);
  }
};
var tree_default = TodoTree;
function isParent(node) {
  if (Object.prototype.hasOwnProperty.call(node, "sourcePath")) {
    return true;
  }
  return false;
}
async function jumpTo(node, nvim, prevBufnr) {
  if (!isParent(node)) {
    const filePath = URI.file(node.path).toString();
    await nvim.command(`${prevBufnr != null ? prevBufnr : ""}wincmd w`);
    await import_coc5.workspace.jumpTo(filePath, {
      line: node.range.start.line - 1,
      character: node.range.start.character - 1
    });
  }
}
function convertRawMatchesToTodoItem(rawMatches) {
  return rawMatches.map((res) => {
    return {
      tagName: res.tagName,
      detail: res.detail,
      shortText: res.shortText,
      path: res.fsPath,
      range: {
        start: {
          character: res.column,
          line: res.line
        },
        end: {
          character: res.column,
          line: res.line
        }
      }
    };
  });
}

// src/index.ts
var import_coc6 = require("coc.nvim");
var _logger;
function log(msgType) {
  return (msg) => _logger[msgType](msg);
}
async function activate(context) {
  if (configuration.enabled === false) {
    return;
  }
  const { subscriptions, logger: logger2 } = context;
  _logger = logger2;
  const todoTree = new tree_default();
  await registerRuntimepath(context.extensionPath);
  subscriptions.push(...generateCommands(extensionName, todoTree.commandsMap));
}
function generateCommands(extensionName2, commandsMap) {
  return Array.from(commandsMap.keys()).map((commandName) => {
    const { callback, args, internal } = commandsMap.get(commandName);
    return import_coc6.commands.registerCommand(
      `${extensionName2}.${commandName}`,
      callback,
      args,
      internal
    );
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  log
});
//# sourceMappingURL=index.js.map
