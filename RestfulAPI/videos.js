/*
	Create and export video link selection function
 */

 // Array of videos to recommend
var ja_videos = [
	'https://www.youtube.com/watch?v=bmtIizXdh88',
	'https://www.youtube.com/watch?v=WBQn0nD27nc',
	'https://www.youtube.com/watch?v=t6rHHnABoT8',
	'https://www.youtube.com/watch?v=syVP6zDZN7I',
	'https://www.youtube.com/watch?v=lZSCGZphjq0',
	'https://www.youtube.com/watch?v=oa6cHEJIjYI&t=18s',
	'https://www.youtube.com/watch?v=eSdSHaUzDts',
	'https://www.youtube.com/watch?v=eRkgK4jfi6M'
];

function getVideo() {
	var numSelections = ja_videos.length;
	var selected = Math.floor((Math.random() * numSelections) + 1);
	return ja_videos[selected];
}

 // Export the module
module.exports = getVideo();