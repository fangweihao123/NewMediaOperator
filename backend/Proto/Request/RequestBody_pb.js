// source: RequestBody.proto
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

var MessagePerUserRequestBody_pb = require('./MessagePerUserRequestBody_pb.js');
goog.object.extend(proto, MessagePerUserRequestBody_pb);
var CreateConversationV2RequestBody_pb = require('./CreateConversationV2RequestBody_pb.js');
goog.object.extend(proto, CreateConversationV2RequestBody_pb);
var MessageByInit_pb = require('./MessageByInit_pb.js');
goog.object.extend(proto, MessageByInit_pb);
var SendMessageRequestBody_pb = require('./SendMessageRequestBody_pb.js');
goog.object.extend(proto, SendMessageRequestBody_pb);
goog.exportSymbol('proto.douyin.RequestBody', null, global);
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
proto.douyin.RequestBody = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, 500, null, null);
};
goog.inherits(proto.douyin.RequestBody, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.douyin.RequestBody.displayName = 'proto.douyin.RequestBody';
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
proto.douyin.RequestBody.prototype.toObject = function(opt_includeInstance) {
  return proto.douyin.RequestBody.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.douyin.RequestBody} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.douyin.RequestBody.toObject = function(includeInstance, msg) {
  var f, obj = {
    sendmessagerequestbody: (f = msg.getSendmessagerequestbody()) && SendMessageRequestBody_pb.SendMessageRequestBody.toObject(includeInstance, f),
    messageperuser: (f = msg.getMessageperuser()) && MessagePerUserRequestBody_pb.MessagePerUserRequestBody.toObject(includeInstance, f),
    createconversationv2requestbody: (f = msg.getCreateconversationv2requestbody()) && CreateConversationV2RequestBody_pb.CreateConversationV2RequestBody.toObject(includeInstance, f),
    messageByInit: (f = msg.getMessageByInit()) && MessageByInit_pb.MessageByInit.toObject(includeInstance, f)
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
 * @return {!proto.douyin.RequestBody}
 */
proto.douyin.RequestBody.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.douyin.RequestBody;
  return proto.douyin.RequestBody.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.douyin.RequestBody} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.douyin.RequestBody}
 */
proto.douyin.RequestBody.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 100:
      var value = new SendMessageRequestBody_pb.SendMessageRequestBody;
      reader.readMessage(value,SendMessageRequestBody_pb.SendMessageRequestBody.deserializeBinaryFromReader);
      msg.setSendmessagerequestbody(value);
      break;
    case 200:
      var value = new MessagePerUserRequestBody_pb.MessagePerUserRequestBody;
      reader.readMessage(value,MessagePerUserRequestBody_pb.MessagePerUserRequestBody.deserializeBinaryFromReader);
      msg.setMessageperuser(value);
      break;
    case 609:
      var value = new CreateConversationV2RequestBody_pb.CreateConversationV2RequestBody;
      reader.readMessage(value,CreateConversationV2RequestBody_pb.CreateConversationV2RequestBody.deserializeBinaryFromReader);
      msg.setCreateconversationv2requestbody(value);
      break;
    case 2043:
      var value = new MessageByInit_pb.MessageByInit;
      reader.readMessage(value,MessageByInit_pb.MessageByInit.deserializeBinaryFromReader);
      msg.setMessageByInit(value);
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
proto.douyin.RequestBody.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.douyin.RequestBody.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.douyin.RequestBody} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.douyin.RequestBody.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSendmessagerequestbody();
  if (f != null) {
    writer.writeMessage(
      100,
      f,
      SendMessageRequestBody_pb.SendMessageRequestBody.serializeBinaryToWriter
    );
  }
  f = message.getMessageperuser();
  if (f != null) {
    writer.writeMessage(
      200,
      f,
      MessagePerUserRequestBody_pb.MessagePerUserRequestBody.serializeBinaryToWriter
    );
  }
  f = message.getCreateconversationv2requestbody();
  if (f != null) {
    writer.writeMessage(
      609,
      f,
      CreateConversationV2RequestBody_pb.CreateConversationV2RequestBody.serializeBinaryToWriter
    );
  }
  f = message.getMessageByInit();
  if (f != null) {
    writer.writeMessage(
      2043,
      f,
      MessageByInit_pb.MessageByInit.serializeBinaryToWriter
    );
  }
};


/**
 * optional SendMessageRequestBody SendMessageRequestBody = 100;
 * @return {?proto.douyin.SendMessageRequestBody}
 */
proto.douyin.RequestBody.prototype.getSendmessagerequestbody = function() {
  return /** @type{?proto.douyin.SendMessageRequestBody} */ (
    jspb.Message.getWrapperField(this, SendMessageRequestBody_pb.SendMessageRequestBody, 100));
};


/**
 * @param {?proto.douyin.SendMessageRequestBody|undefined} value
 * @return {!proto.douyin.RequestBody} returns this
*/
proto.douyin.RequestBody.prototype.setSendmessagerequestbody = function(value) {
  return jspb.Message.setWrapperField(this, 100, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.douyin.RequestBody} returns this
 */
proto.douyin.RequestBody.prototype.clearSendmessagerequestbody = function() {
  return this.setSendmessagerequestbody(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.douyin.RequestBody.prototype.hasSendmessagerequestbody = function() {
  return jspb.Message.getField(this, 100) != null;
};


/**
 * optional MessagePerUserRequestBody messagePerUser = 200;
 * @return {?proto.douyin.MessagePerUserRequestBody}
 */
proto.douyin.RequestBody.prototype.getMessageperuser = function() {
  return /** @type{?proto.douyin.MessagePerUserRequestBody} */ (
    jspb.Message.getWrapperField(this, MessagePerUserRequestBody_pb.MessagePerUserRequestBody, 200));
};


/**
 * @param {?proto.douyin.MessagePerUserRequestBody|undefined} value
 * @return {!proto.douyin.RequestBody} returns this
*/
proto.douyin.RequestBody.prototype.setMessageperuser = function(value) {
  return jspb.Message.setWrapperField(this, 200, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.douyin.RequestBody} returns this
 */
proto.douyin.RequestBody.prototype.clearMessageperuser = function() {
  return this.setMessageperuser(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.douyin.RequestBody.prototype.hasMessageperuser = function() {
  return jspb.Message.getField(this, 200) != null;
};


/**
 * optional CreateConversationV2RequestBody CreateConversationV2RequestBody = 609;
 * @return {?proto.douyin.CreateConversationV2RequestBody}
 */
proto.douyin.RequestBody.prototype.getCreateconversationv2requestbody = function() {
  return /** @type{?proto.douyin.CreateConversationV2RequestBody} */ (
    jspb.Message.getWrapperField(this, CreateConversationV2RequestBody_pb.CreateConversationV2RequestBody, 609));
};


/**
 * @param {?proto.douyin.CreateConversationV2RequestBody|undefined} value
 * @return {!proto.douyin.RequestBody} returns this
*/
proto.douyin.RequestBody.prototype.setCreateconversationv2requestbody = function(value) {
  return jspb.Message.setWrapperField(this, 609, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.douyin.RequestBody} returns this
 */
proto.douyin.RequestBody.prototype.clearCreateconversationv2requestbody = function() {
  return this.setCreateconversationv2requestbody(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.douyin.RequestBody.prototype.hasCreateconversationv2requestbody = function() {
  return jspb.Message.getField(this, 609) != null;
};


/**
 * optional MessageByInit message_by_init = 2043;
 * @return {?proto.douyin.MessageByInit}
 */
proto.douyin.RequestBody.prototype.getMessageByInit = function() {
  return /** @type{?proto.douyin.MessageByInit} */ (
    jspb.Message.getWrapperField(this, MessageByInit_pb.MessageByInit, 2043));
};


/**
 * @param {?proto.douyin.MessageByInit|undefined} value
 * @return {!proto.douyin.RequestBody} returns this
*/
proto.douyin.RequestBody.prototype.setMessageByInit = function(value) {
  return jspb.Message.setWrapperField(this, 2043, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.douyin.RequestBody} returns this
 */
proto.douyin.RequestBody.prototype.clearMessageByInit = function() {
  return this.setMessageByInit(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.douyin.RequestBody.prototype.hasMessageByInit = function() {
  return jspb.Message.getField(this, 2043) != null;
};


goog.object.extend(exports, proto.douyin);
