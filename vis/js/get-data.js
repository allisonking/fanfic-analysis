//var harry = getCharacterData('harry.csv')
//var neville = getCharacterData('neville.csv');

var parseTime = d3.timeParse("%Y-%m-%d");
var characters = {};

var character_list = ['albus_severus', 'draco', 'dumbledore', 'fred', 'ginny',
'harry', 'hermione', 'lily', 'lupin', 'neville', 'ron', 'sirius', 'snape', 'voldemort'];

var character_mapping = {'all':'All Characters','albus_severus' : 'Albus Severus Potter',
'dumbledore' : 'Albus Dumbledore', 'draco' : 'Draco Malfoy', 'fred' : 'Fred Weasley', 'ginny' : 'Ginny Weasley',
'harry' : 'Harry Potter', 'hermione' : 'Hermione Granger', 'lily' : 'Lily Potter (Evans)',
'lupin': 'Remus Lupin', 'neville': 'Neville Longbottom', 'ron': 'Ron Weasley',
'sirius': 'Sirius Black', 'snape': 'Severus Snape', 'voldemort' : 'Lord Voldemort'}

character_list.forEach(function(character) {
  getCharacterData(character);
});


function getCharacterData(character_name) {
  d3.csv('data/characters/'+character_name+'.csv', function(data) {
    data.forEach(function(d) {
      d.date = parseTime(d.date);
      d.count = +d.count;
    })
    characters[character_name] = data;
  })
}
character_list.unshift('all')
var menu = d3.select('#menu select')


menu.selectAll('option')
    .data(character_list)
    .enter().append('option')
      .text(function(d) { return character_mapping[d];})
      .attr('value', function(d) {return d;});
