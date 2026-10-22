// "Optimize my YouTube thumbnails": superbot opens YouTube Studio, sorts the channel's videos by thumbnail
// click-through in Analytics, finds Sheet Pan Gnocchi at 2.1%, puts its 3 new thumbnails into Studio's A/B test and starts
// it, and a week later reads the result in Analytics (version 2 at 6.8%), keeps it on the video, and sees every video's
// rate up after the same test, the channel at 5.6% (plays/youtube/: pages.json, pages.mail.json; CREDITS*.txt there).
import { TRANSCRIPTS } from '../transcripts.bdeb2397.js';

export default {
  transcript: TRANSCRIPTS.youtube,
  pages: ['./plays/youtube/pages.json', './plays/youtube/pages.mail.json'],
  script(p) {
    p.post().wait(0.3).post();
    p.wait(0.4).control().wait(0.5).open('content-before', 'studio.youtube.com');
    p.step().wait(0.4).point('gnocchi-thumb');
    p.wait(0.6).open('analytics');
    p.wait(0.3).point('ctr-header').step();
    p.wait(0.4).point('row1').step().post();
    // the three new thumbnails go into Studio's own A/B test
    p.wait(1.4).open('details', 'studio.youtube.com/video/kQ4mZ8vNx2c/edit');
    p.wait(0.4).press('test').show('test');
    p.wait(0.4).step().post();
    p.wait(1.6).press('done').step();
    p.wait(1.0).step();
    // a week later: the result in Analytics, version 2 kept on the video, and the other videos' tests
    p.wait(1.6).open('analytics-after', 'studio.youtube.com/channel/UCwk7nQx2LmPzR4vYt9HfE1A/analytics');
    p.wait(0.3).point('gnocchi').wait(0.3).point('gnocchi-ctr').step().post();
    p.wait(1.4).open('content-after', 'studio.youtube.com');
    p.wait(0.3).point('gnocchi-thumb').step();
    p.wait(1.2).back('analytics-after');
    p.wait(0.3).point('row1').step();
    p.wait(0.8).point('total-ctr').step().post();
  },
};
