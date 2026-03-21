const yt = require('youtube-transcript');
console.log("Keys:", Object.keys(yt));
if (yt.default) {
  console.log("Default keys:", Object.keys(yt.default));
  if (typeof yt.default.fetchTranscript === 'function') {
      console.log("yt.default.fetchTranscript IS A FUNCTION");
  }
}
if (typeof yt.YoutubeTranscript?.fetchTranscript === 'function') {
  console.log("yt.YoutubeTranscript.fetchTranscript IS A FUNCTION");
}
