
var Haml = require('./haml');

var readUntilEnd = function(stream, callback) {
    var chunks = [];
    stream.on('data', function(chunk) {
        chunks.push(chunk.toString('utf-8'));
    });
    stream.on('end', function() {
        callback(chunks.join(''));
    });
}

readUntilEnd(process.openStdin(), function(template) {
    process.stdout.write(
                        Haml.optimize(
                            Haml.compile(
                                template)));
});
