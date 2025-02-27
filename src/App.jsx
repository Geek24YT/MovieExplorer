import React, { useEffect } from 'react'
import Search from './components/Search'
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept:"application/json",
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  const[searchTerm, setSearchTerm] = React.useState('');
  const[errorMessage,setErrorMessage] = React.useState(null);
  const[movieList, setMovieList] = React.useState([]);
  const[isLoading, setIsLoading] = React.useState(false);
  const[debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const[trendingMovies, setTrendingMovies] = React.useState([]);
  
  useDebounce(()=>setDebouncedSearchTerm(searchTerm),500,[searchTerm]);

  const fetchMovies = async (query = '')=>{
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint,API_OPTIONS);

      if(!response.ok){
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();

      if(data.Response === 'False'){
        setErrorMessage(data.Error || "Failed to fetch the movies");
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);
      
      if(query && data.results.length>0){
        await updateSearchCount(query,data.results[0]);
      }
    } catch (error) {
      console.log("API calling error - ",error);
      setErrorMessage("Error fetching data, Please try again later");
    } finally{
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () =>{
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.log("Error while fetching trending movies - ",error);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
    // loadTrendingMovies();  -- don't call this function here as it will call this every time. 
  },[debouncedSearchTerm])

  useEffect(()=>{
    loadTrendingMovies();
  },[])

  return (
    <main>
      <div className='pattern'/>
      <div className='wrapper'> 
        <header>
          <img src='./hero.png' alt='Hero Banner'/>
          <h1>Find <span className='text-gradient'>Movies</span> You'll Enjoy Without The Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>

        {trendingMovies.length > 0 && (
          <section className='trending'>
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie,index)=>(
                <li key={movie.$id}>
                  <p>{index+1}</p>
                  <img src={movie.poster_url} alt={movie.title}/>
                </li>
              ))}
            </ul>
          </section>
        )}
       <section className='all-movies'>
        <h2>All Movies</h2>

        {isLoading ? (
         <Spinner/>
        ): errorMessage ? (
          <p className='text-red-500'>{errorMessage}</p>
        ) : (
          <ul>
            {movieList.map((movie,index)=>(
             <MovieCard key={movie.id} movie={movie}/>
            ))}
          </ul>
        )}
       </section>  
      </div>
    </main>
  )
}

export default App