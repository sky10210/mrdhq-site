(() => {
  const NOTICE = "Paste is disabled in Canvas Studio. Please type your response in your own words.";

  function isStudentWritingField(target) {
    if (!target || !target.matches) return false;
    return target.matches('textarea, input[type="text"]');
  }

  function blockPaste(event) {
    if (!isStudentWritingField(event.target)) return;
    event.preventDefault();
    if (typeof showToast === "function") showToast(NOTICE);
    else alert(NOTICE);
  }

  function blockDrop(event) {
    if (!isStudentWritingField(event.target)) return;
    const transfer = event.dataTransfer;
    if (!transfer) return;
    if (transfer.types && Array.from(transfer.types).includes("text/plain")) {
      event.preventDefault();
      if (typeof showToast === "function") showToast("Text drop is disabled. Please type your response.");
    }
  }

  document.addEventListener("paste", blockPaste, true);
  document.addEventListener("drop", blockDrop, true);
})();
