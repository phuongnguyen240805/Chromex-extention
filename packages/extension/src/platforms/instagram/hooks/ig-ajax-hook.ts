(() => {
  const xhr = XMLHttpRequest.prototype;
  const send = xhr.send;
  xhr.send = function(this: XMLHttpRequest, ...args: any[]) {
    this.addEventListener("load", function() {
      const url = this.responseURL;
      if (
        url.indexOf('/graphql/query') === -1 &&
        url.indexOf('/api/graphql') === -1 &&
        url.indexOf('/api/v1/feed/user') === -1 &&
        url.indexOf('api/v1/tags/web_info') === -1 &&
        url.indexOf('/api/v1/fbsearch/web/top_serp') === -1
      ) {
        return;
      }
      if (this.responseType === '' || this.responseType === 'text') {
        try {
          const response = this.responseText;
          JSON.parse(response);
          const node = document.createElement("template");
          node.setAttribute("data-url", url);
          node.setAttribute("data-path", document.location.pathname);
          node.textContent = response;
          document.body.appendChild(node);
        } catch (e) {
          console.log("Error parsing/handling Instagram AJAX response:", e);
        }
      }
    });
    return send.apply(this, args as any);
  };
})();
