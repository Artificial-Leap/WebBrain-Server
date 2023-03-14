const conversations = {};

export default function should_respond(
  sender,
  message,
  channelId,
  hasMention,
  hasMentionToOtherUser
) {
  if (!conversations[channelId]) {
    conversations[channelId] = {};
  }

  if (hasMentionToOtherUser) {
    if (conversations[channelId][sender]) {
      clearTimeout(conversations[channelId][sender]);
      delete conversations[channelId][sender];
    }
    return false;
  } else {
    if (hasMention) {
      if (!conversations[channelId][sender]) {
        conversations[channelId][sender] = setTimeout(() => {
          delete conversations[channelId][sender];
        }, 1000 * 60 * 5);
      }

      return true;
    } else {
      if (conversations[channelId][sender]) {
        return true;
      } else {
        message = message.toLowerCase().trim();
        if (
          message.includes("hi") ||
          message.includes("hello") ||
          message.includes("hey") ||
          message.includes("ginny")
        ) {
          conversations[channelId][sender] = setTimeout(() => {
            delete conversations[channelId][sender];
          }, 1000 * 60 * 5);

          return true;
        }

        return false;
      }
    }
  }
}
