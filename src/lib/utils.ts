export const formatMessageContent = (message: string) => {
    return message
      .replace(/\n/g, "<br />")
      .replace(/\t/g, " ")
      .replace("    ", " ")
      .replace("[cb]", '<pre style="background-color: #D3D3D3">')
      .replace("[/cb]", "</pre>");
  };