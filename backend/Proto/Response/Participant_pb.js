// source: Participant.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = (function() { return this || window || global || self || Function('return this')(); }).call(null);

goog.exportSymbol('proto.douyin.Participant', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.douyin.Participant = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.douyin.Participant, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.douyin.Participant.displayName = 'proto.douyin.Participant';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.douyin.Participant.prototype.toObject = function(opt_includeInstance) {
  return proto.douyin.Participant.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.douyin.Participant} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.douyin.Participant.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, 0),
    sortOrder: jspb.Message.getFieldWithDefault(msg, 2, 0),
    role: jspb.Message.getFieldWithDefault(msg, 3, 0),
    alias: jspb.Message.getFieldWithDefault(msg, 4, ""),
    secUid: jspb.Message.getFieldWithDefault(msg, 5, ""),
    blocked: jspb.Message.getFieldWithDefault(msg, 6, 0),
    leftBlockTime: jspb.Message.getFieldWithDefault(msg, 7, 0),
    extMap: (f = msg.getExtMap()) ? f.toObject(includeInstance, undefined) : []
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.douyin.Participant}
 */
proto.douyin.Participant.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.douyin.Participant;
  return proto.douyin.Participant.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.douyin.Participant} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.douyin.Participant}
 */
proto.douyin.Participant.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setSortOrder(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setRole(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setAlias(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setSecUid(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setBlocked(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setLeftBlockTime(value);
      break;
    case 8:
      var value = msg.getExtMap();
      reader.readMessage(value, function(message, reader) {
        jspb.Map.deserializeBinary(message, reader, jspb.BinaryReader.prototype.readString, jspb.BinaryReader.prototype.readString, null, "", "");
         });
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.douyin.Participant.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.douyin.Participant.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.douyin.Participant} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.douyin.Participant.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getSortOrder();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
  f = message.getRole();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getAlias();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getSecUid();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getBlocked();
  if (f !== 0) {
    writer.writeInt32(
      6,
      f
    );
  }
  f = message.getLeftBlockTime();
  if (f !== 0) {
    writer.writeInt64(
      7,
      f
    );
  }
  f = message.getExtMap(true);
  if (f && f.getLength() > 0) {
    f.serializeBinary(8, writer, jspb.BinaryWriter.prototype.writeString, jspb.BinaryWriter.prototype.writeString);
  }
};


/**
 * optional int64 user_id = 1;
 * @return {number}
 */
proto.douyin.Participant.prototype.getUserId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.douyin.Participant} returns this
 */
proto.douyin.Participant.prototype.setUserId = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int64 sort_order = 2;
 * @return {number}
 */
proto.douyin.Participant.prototype.getSortOrder = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.douyin.Participant} returns this
 */
proto.douyin.Participant.prototype.setSortOrder = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int32 role = 3;
 * @return {number}
 */
proto.douyin.Participant.prototype.getRole = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.douyin.Participant} returns this
 */
proto.douyin.Participant.prototype.setRole = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string alias = 4;
 * @return {string}
 */
proto.douyin.Participant.prototype.getAlias = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.douyin.Participant} returns this
 */
proto.douyin.Participant.prototype.setAlias = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string sec_uid = 5;
 * @return {string}
 */
proto.douyin.Participant.prototype.getSecUid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.douyin.Participant} returns this
 */
proto.douyin.Participant.prototype.setSecUid = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional int32 blocked = 6;
 * @return {number}
 */
proto.douyin.Participant.prototype.getBlocked = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.douyin.Participant} returns this
 */
proto.douyin.Participant.prototype.setBlocked = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional int64 left_block_time = 7;
 * @return {number}
 */
proto.douyin.Participant.prototype.getLeftBlockTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/**
 * @param {number} value
 * @return {!proto.douyin.Participant} returns this
 */
proto.douyin.Participant.prototype.setLeftBlockTime = function(value) {
  return jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * map<string, string> ext = 8;
 * @param {boolean=} opt_noLazyCreate Do not create the map if
 * empty, instead returning `undefined`
 * @return {!jspb.Map<string,string>}
 */
proto.douyin.Participant.prototype.getExtMap = function(opt_noLazyCreate) {
  return /** @type {!jspb.Map<string,string>} */ (
      jspb.Message.getMapField(this, 8, opt_noLazyCreate,
      null));
};


/**
 * Clears values from the map. The map will be non-null.
 * @return {!proto.douyin.Participant} returns this
 */
proto.douyin.Participant.prototype.clearExtMap = function() {
  this.getExtMap().clear();
  return this;};


goog.object.extend(exports, proto.douyin);
