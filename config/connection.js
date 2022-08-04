const mongoClient = require('mongodb').MongoClient
const state = {
    db: null
}

module.exports.connect = (done) => {
    const url = 'mongodb+srv://abin:Abin@3043@cluster.8dx1hde.mongodb.net/?retryWrites=true&w=majority'
    const dbname = 'shopping'

    mongoClient.connect(url, (err, data) => {
        if (err) return done(err)
        state.db = data.db(dbname)
        done()
    })

}

module.exports.get=() => {
    return state.db
}