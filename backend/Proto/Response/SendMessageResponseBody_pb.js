// source: SendMessageResponseBody.proto
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

goog.exportSymbol('proto.douyin.SendMessageResponseBody', null, global);
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
proto.douyin.SendMessageResponseBody = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.douyin.SendMessageResponseBody, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.douyin.SendMessageResponseBody.displayName = 'proto.douyin.SendMessageResponseBody';
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
proto.douyin.SendMessageResponseBody.prototype.toObject = function(opt_includeInstance) {
  return proto.douyin.SendMessageResponseBody.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.douyin.SendMessageResponseBody} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.douyin.SendMessageResponseBody.toObject = function(includeInstance, msg) {
  var f, obj = {
    serverMessageId: jspb.Message.getFieldWithDefault(msg, 1, 0),
    extraInfo: jspb.Message.getFieldWithDefault(msg, 2, ""),
    status: jspb.Message.getFieldWithDefault(msg, 3, 0),
    clientMessageId: jspb.Message.getFieldWithDefault(msg, 4, ""),
    checkCode: jspb.Message.getFieldWithDefault(msg, 5, 0),
    checkMessage: jspb.Message.getFieldWithDefault(msg, 6, "")
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
 * @return {!proto.douyin.SendMessageResponseBody}
 */
proto.douyin.SendMessageResponseBody.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.douyin.SendMessageResponseBody;
  return proto.douyin.SendMessageResponseBody.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.douyin.SendMessageResponseBody} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.douyin.SendMessageResponseBody}
 */
proto.douyin.SendMessageResponseBody.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setServerMessageId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setExtraInfo(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setStatus(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setClientMessageId(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setCheckCode(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setCheckMessage(value);
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
proto.douyin.SendMessageResponseBody.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.douyin.SendMessageResponseBody.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.douyin.SendMessageResponseBody} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.douyin.SendMessageResponseBody.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getServerMessageId();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getExtraInfo();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getStatus();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getClientMessageId();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getCheckCode();
  if (f !== 0) {
    writer.writeInt64(
      5,
      f
    );
  }
  f = message.getCheckMessage();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
};


/**
 * optional int64 server_message_id = 1;
 * @return {number}
 */
proto.douyin.SendMessageResponseBody.prototype.getServerMessageId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.douyin.SendMessageResponseBody} returns this
 */
proto.douyin.SendMessageResponseBody.prototype.setServerMessageId = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string extra_info = 2;
 * @return {string}
 */
proto.douyin.SendMessageResponseBody.prototype.getExtraInfo = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.douyin.SendMessageResponseBody} returns this
 */
proto.douyin.SendMessageResponseBody.prototype.setExtraInfo = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int32 status = 3;
 * @return {number}
 */
proto.douyin.SendMessageResponseBody.prototype.getStatus = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.douyin.SendMessageResponseBody} returns this
 */
proto.douyin.SendMessageResponseBody.prototype.setStatus = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string client_message_id = 4;
 * @return {string}
 */
proto.douyin.SendMessageResponseBody.prototype.getClientMessageId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.douyin.SendMessageResponseBody} returns this
 */
proto.douyin.SendMessageResponseBody.prototype.setClientMessageId = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional int64 check_code = 5;
 * @return {number}
 */
proto.douyin.SendMessageResponseBody.prototype.getCheckCode = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.douyin.SendMessageResponseBody} returns this
 */
proto.douyin.SendMessageResponseBody.prototype.setCheckCode = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional string check_message = 6;
 * @return {string}
 */
proto.douyin.SendMessageResponseBody.prototype.getCheckMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.douyin.SendMessageResponseBody} returns this
 */
proto.douyin.SendMessageResponseBody.prototype.setCheckMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


goog.object.extend(exports, proto.douyin);
