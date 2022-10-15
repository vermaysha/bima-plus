import axios, { AxiosRequestConfig } from 'axios'
import { setupCache } from 'axios-cache-adapter'
import FileStore from './store/fileStore'

// `axios-cache-adapter` options
const instanceCache = setupCache({
  store: new FileStore(),
  maxAge: 10 * 60 * 1000, // 10 Minutes
  exclude: {
    methods: ['put', 'patch', 'delete']
  }
})

// `axios` options
const config: AxiosRequestConfig = {
  adapter: instanceCache.adapter
}

const httpClient = axios.create(config)

export default httpClient
