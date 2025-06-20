import express from 'express';
import cors from 'cors';
import { connectToDB, closeConnection } from './mongo_iterate.js';
import { ObjectId } from "mongodb";
const app = express();
// Use environment PORT or fallback to 3006
const PORT = process.env.PORT || 3006;
import { CallGemini } from './OpenAiApi.js';

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Movie API is running' });
});

// Extra Functions
function buildMovieContext(movies) {
    const movieSummary = movies.map(movie => ({
        Title: movie.title,
        Cast: movie.cast?.join(', '),
        Genres: movie.genres?.join(', '),
        Plot: movie.fullplot,
        Runtime: movie.runtime,
        Languages: movie.languages?.join(', '),
        Release: movie.released,
        Directors: movie.directors?.join(', '),
        Writers: movie.writers?.join(', '),
        Year: movie.year,
        IMDb: movie.imdb?.rating,
        Tomatoes: movie.tomatoes?.viewer?.rating,
        Country: movie.countries?.join(', '),
        Awards: movie.awards?.text
    }));
    return JSON.stringify(movieSummary, null, 2);
}

function analyzeQuery(query) {
    const lowerQuery = query.toLowerCase();

    const keywords = {
        genres: ['action', 'adventure', 'animation', 'comedy', 'crime', 'documentary',
            'drama', 'family', 'fantasy', 'horror', 'music', 'mystery', 'romance',
            'sci-fi', 'science fiction', 'thriller', 'war', 'western'],
        years: query.match(/\b(19|20)\d{2}\b/g),
        ratings: ['good', 'bad', 'best', 'worst', 'highly rated', 'low rated', 'top rated'],
        moods: ['funny', 'sad', 'scary', 'exciting', 'romantic', 'dark', 'light', 'serious'],
        similarity: ['similar', 'like', 'recommend', 'suggestion'],
        quality: ['hidden gem', 'underrated', 'overrated', 'cult', 'classic']
    };

    return {
        detectedGenres: keywords.genres.filter(g => lowerQuery.includes(g)),
        detectedYears: keywords.years || [],
        detectedMoods: keywords.moods.filter(m => lowerQuery.includes(m)),
        queryType: determineQueryType(lowerQuery),
        needsFiltering: shouldFilterMovies(lowerQuery)
    };
}

function determineQueryType(query) {
    if (query.includes('similar') || query.includes('like') || query.includes('recommend')) {
        return 'recommendation';
    }
    if (query.includes('best') || query.includes('top') || query.includes('worst')) {
        return 'ranking';
    }
    if (query.includes('genre') || query.includes('type')) {
        return 'genre';
    }
    if (query.includes('year') || /\b(19|20)\d{2}\b/.test(query)) {
        return 'year';
    }
    if (query.includes('hidden') || query.includes('underrated')) {
        return 'discovery';
    }
    return 'general';
}

function shouldFilterMovies(query) {
    return query.includes('genre') ||
        query.includes('year') ||
        /\b(19|20)\d{2}\b/.test(query) ||
        query.includes('rating') ||
        query.includes('best') ||
        query.includes('worst');
}

function filterMoviesByQuery(movies, queryAnalysis) {
    let filteredMovies = [...movies];

    if (queryAnalysis.detectedGenres.length > 0) {
        filteredMovies = filteredMovies.filter(movie =>
                movie.genres && movie.genres.some(genre =>
                    queryAnalysis.detectedGenres.some(detected =>
                        genre.toLowerCase().includes(detected)
                    )
                )
        );
    }

    if (queryAnalysis.detectedYears.length > 0) {
        const years = queryAnalysis.detectedYears.map(y => parseInt(y));
        filteredMovies = filteredMovies.filter(movie =>
            movie.year && years.includes(movie.year)
        );
    }

    if (queryAnalysis.queryType === 'ranking') {
        filteredMovies = filteredMovies.filter(movie =>
            movie.imdb && movie.imdb.rating
        ).sort((a, b) => (b.imdb.rating || 0) - (a.imdb.rating || 0));
    }

    return filteredMovies;
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Endpoints
app.get('/movies', async (req, res) => {
    try {
        const db = await connectToDB();
        const movies = await db.collection('movies').find().limit(200).toArray();
        res.json(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/movies/search/:query', async (req, res) => {
    try {
        const db = await connectToDB();
        const query = req.params.query;

        const movies = await db.collection('movies').find({
            title: { $regex: query, $options: 'i' }
        }).toArray();

        console.log(`Found ${movies.length} movies for query: ${query}`);
        res.json(movies);
    } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/movies/query', async (req, res) => {
    try {
        const { query, userType = 'casual' } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query is required and must be a string' });
        }

        const queryAnalysis = analyzeQuery(query);
        const db = await connectToDB();
        let movies = await db.collection('movies').find().limit(200).toArray();

        if (queryAnalysis.needsFiltering) {
            movies = filterMoviesByQuery(movies, queryAnalysis);
            console.log(`Filtered from 200 to ${movies.length} movies`);
        }

        const movieContext = buildMovieContext(movies);

        const Users = {
            casual: "You are a friendly movie recommender. Focus on entertaining, popular films. Be conversational and explain why movies are fun to watch, do not mentioned the Database, youre just a person doing a recommendation.",
            critic: "You are a sophisticated film analyst. Consider cinematography, direction, cultural impact, and artistic merit, do not mentioned the Database, youre just a person doing a recommendation.",
            genre: "You are a genre expert. Focus on specific genres, tropes, and deep cuts within categories, do not mentioned the Database, youre just a person doing a recommendation."
        };

        const systemMessage = `${Users[userType]}

        Query Analysis: ${JSON.stringify(queryAnalysis)}
        
        Here is the movie database (filtered based on the query):
        ${movieContext}
        
        Answer the user's question based on these movies. Always recommend from this list and explain your reasoning. 
        If the query asks for specific genres, years, or ratings, focus on those criteria.
        
        Give me the answer in this format:
        {
          "Explanation": "your normal response",
          "Titles": ["movie title 1", "movie title 2", "movie title 3"]
        }
        
        Make sure the response is valid JSON format.`;

        const respostaRaw = await CallGemini(query, systemMessage);
        console.log('AI Response:', respostaRaw);

        let resposta;
        try {
            // Clean the response to ensure it's valid JSON
            const cleanResponse = respostaRaw.replace(/```json\n?|\n?```/g, '').trim();
            resposta = JSON.parse(cleanResponse);
        } catch (e) {
            console.error('Failed to parse AI response:', e);
            // Fallback response
            resposta = {
                Explanation: "I apologize, but I encountered an issue processing your request. Please try again.",
                Titles: []
            };
        }

        res.json({
            response: resposta.Explanation,
            Titles: Array.isArray(resposta.Titles) ? resposta.Titles : [],
            userType: userType,
            query: query,
            analysis: queryAnalysis,
            moviesConsidered: movies.length
        });

    } catch (error) {
        console.error('Error fetching Response:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/Comments', async (req, res) => {
    try {
        const db = await connectToDB();
        const Comments = await db.collection('comments').find().toArray();
        res.json(Comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/Comments/:id', async (req, res) => {
    try {
        const db = await connectToDB();
        const movieid = new ObjectId(req.params.id);
        const Comments = await db.collection('comments').find({ movie_id: movieid }).toArray();
        res.json(Comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/Comments/add', async (req, res) => {
    try {
        const db = await connectToDB();
        const { name, email, movie_id, text } = req.body;

        if (!name || !email || !movie_id || !text) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newComment = {
            name,
            email,
            movie_id: new ObjectId(movie_id),
            text,
            date: new Date()
        };

        const result = await db.collection('comments').insertOne(newComment);

        res.status(201).json({
            message: 'Comment added successfully',
            commentId: result.insertedId
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

app.put('/Comments/update/:id', async (req, res) => {
    try {
        const db = await connectToDB();
        const { text } = req.body;
        const id = req.params.id;

        if (!id || !text) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await db.collection('comments').updateOne(
            { _id: new ObjectId(id) },
            { $set: { text, date: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        res.status(200).json({
            message: 'Comment updated successfully',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

app.delete('/Comments/delete/:id', async (req, res) => {
    try {
        const db = await connectToDB();
        const commentid = new ObjectId(req.params.id);
        const result = await db.collection('comments').deleteOne({ _id: commentid });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start server
app.listen(PORT, async () => {
    try {
        await connectToDB();
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    } catch (err) {
        console.error('Failed to connect to MongoDB on startup', err);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await closeConnection();
    process.exit(0);
});