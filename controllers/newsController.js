import axios from 'axios';

async function makeApiRequest(url) {
    try {
        const response = await axios.get(url);
        return { status: response.status, data: response.data }; 
    } catch (error) {
        return { status: 500, message: error.message }; 
    }
}

export async function getAllNews(req, res) {
    try {
        const pageSize = parseInt(req.query.pageSize) || 80;
        const page = parseInt(req.query.page) || 1;
        const q = req.query.q || 'business';
        
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}&apiKey=${process.env.NEWS_API_KEY}`;
        
        const result = await makeApiRequest(url);
        const articles = result.data.articles || []; // Assuming articles are in result.data.articles

        // Map the articles into the desired structure
        const data = articles.map(article => ({
            image: article.urlToImage || "",       // Assuming `urlToImage` is the key for the image
            title: article.title || "",            // Assuming `title` is the key for the title
            subtitle: article.description || "",   // Assuming `description` is the key for the subtitle
            readmore_url: article.url || ""        // Assuming `url` is the key for the article's read more link
        })).filter(article => article.image && article.title && article.subtitle && article.readmore_url);

        const status = result.status || 200;
        res.status(status).json({
            status: true,
            message: "All news fetched successfully",
            data
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Failed to fetch news!",
            error: error.message
        });
    }
}


export async function getTopHeadlines(req, res) {
    try {
        const pageSize = parseInt(req.query.pageSize) || 80;
        const page = parseInt(req.query.page) || 1;
        const category = req.query.category || "general";

        const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&page=${page}&pageSize=${pageSize}&apiKey=${process.env.NEWS_API_KEY}`;
        const result = await makeApiRequest(url);

        const articles = result.data.articles || []; // Assuming articles are in result.data.articles

        // Map the articles into the desired structure
        const data = articles.map(article => ({
            image: article.urlToImage || "",       // Assuming `urlToImage` is the key for the image
            title: article.title || "",            // Assuming `title` is the key for the title
            subtitle: article.description || "",   // Assuming `description` is the key for the subtitle
            readmore_url: article.url || ""        // Assuming `url` is the key for the article's read more link
        })).filter(article => article.image && article.title && article.subtitle && article.readmore_url);

        const status = result.status || 200;
        res.status(status).json({
            status: true,
            message: "Top Headlines fetched successfully",
            data
        });

        return {
            status: true,
            message: "Top Headlines fetched successfully",
            data,
        };
    } catch (error) {
        res.status(500).json({ 
            status: false,
            message: "Top Headlines fetching failed!",
            error: error.message
        });
        return {
            status: false,
            message: "Top Headlines fetching failed!",
        };
    }
}


export async function getCountryHeadlines(req, res) {
    try {
        const pageSize = parseInt(req.query.pageSize) || 80;
        const page = parseInt(req.query.page) || 1;
        const country = req.params.iso;

        const url = `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${process.env.NEWS_API_KEY}&page=${page}&pageSize=${pageSize}`;
        const result = await makeApiRequest(url);

        const articles = result.data.articles || []; // Assuming articles are in result.data.articles

        // Map the articles into the desired structure
        const data = articles.map(article => ({
            image: article.urlToImage || "",       // Assuming `urlToImage` is the key for the image
            title: article.title || "",            // Assuming `title` is the key for the title
            subtitle: article.description || "",   // Assuming `description` is the key for the subtitle
            readmore_url: article.url || ""        // Assuming `url` is the key for the article's read more link
        })).filter(article => article.image && article.title && article.subtitle && article.readmore_url);

        const status = result.status || 200;
        res.status(status).json({
            status: true,
            message: "Country-specific headlines fetched successfully",
            data
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Failed to fetch country-specific headlines!",
            error: error.message
        });
    }
}


export async function getNewsByDate(req, res) {
    try {
        const today = new Date().toISOString().split('T')[0]; 
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        const fromDate = fiveDaysAgo.toISOString().split('T')[0]; 
        
        const url = `https://newsapi.org/v2/everything?q=(business OR tech)&from=${fromDate}&to=${today}&language=en&apiKey=${process.env.NEWS_API_KEY}`;

        const response = await fetch(url);
        const result = await response.json();

        const articles = result.articles || []; // Assuming articles are in result.articles

        // Map the articles into the desired structure
        const data = articles.map(article => ({
            image: article.urlToImage || "",       // Assuming `urlToImage` is the key for the image
            title: article.title || "",            // Assuming `title` is the key for the title
            subtitle: article.description || "",   // Assuming `description` is the key for the subtitle
            readmore_url: article.url || ""        // Assuming `url` is the key for the article's read more link
        })).filter(article => article.image && article.title && article.subtitle && article.readmore_url);

        res.status(200).json({
            status: true,
            message: "News from the last 5 days fetched successfully",
            data
        });

    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
}


export async function getTodaysNews(req, res) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);
        const fromDate = twoDaysAgo.toISOString().split('T')[0];

        const url = `https://newsapi.org/v2/everything?q=(business OR tech)&from=${fromDate}&to=${today}&language=en&apiKey=${process.env.NEWS_API_KEY}`;

        const response = await fetch(url);
        const result = await response.json();

        const articles = result.articles || []; // Assuming articles are in result.articles

        // Map the articles into the desired structure
        const data = articles.map(article => ({
            image: article.urlToImage || "",       // Assuming `urlToImage` is the key for the image
            title: article.title || "",            // Assuming `title` is the key for the title
            subtitle: article.description || "",   // Assuming `description` is the key for the subtitle
            readmore_url: article.url || ""        // Assuming `url` is the key for the article's read more link
        }))
        .filter(article => article.image && article.title && article.subtitle && article.readmore_url);

        res.status(200).json({
            status: true,
            message: "Today's news fetched successfully",
            data
        });

    } catch (error) {
        console.error('Error fetching today\'s news:', error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
}


