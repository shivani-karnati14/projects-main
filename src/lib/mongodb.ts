/**
* MongoDB-based database service
* Replaces Supabase client with MongoDB API calls
*/
 
// Database types (equivalent to Supabase types)
export interface StructuredData {
  id?: string
  name?: string
  title?: string
  company?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  other_info?: string[]
  source: 'text_scan' | 'file_upload'
  processing_method?: string
  confidence_score?: number
  raw_text?: string
  created_at?: string
  updated_at?: string
}
 
export interface LinkedInCompany {
  id?: string
  company_name: string
  website?: string
  industry?: string
  company_size?: string
  hq_location?: string
  company_type?: string
  linkedin_url?: string
  scraped_at?: string
  created_at?: string
  updated_at?: string
}
 
// API Configuration
// Use a function to safely access environment variables
function getApiBaseUrl(): string {
  try {
    return import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.PROD 
        ? 'https://your-production-api-domain.com' 
        : 'http://localhost:8000');
  } catch {
    // Fallback for environments where import.meta.env is not available
    return 'http://localhost:8000';
  }
}

const API_BASE_URL = getApiBaseUrl();
 
class MongoDBService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })
 
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
      }
 
      const data = await response.json()
      return data
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error)
      throw error
    }
  }
 
  // Structured Data Methods
  
  /**
   * Save structured data from text scanning
   */
  async saveTextScanData(data: Omit<StructuredData, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('💾 Attempting to save text scan data via MongoDB API:', data)
      
      const result = await this.makeRequest<{
        success: boolean
        data: StructuredData
        message: string
      }>('/data/structured-data', {
        method: 'POST',
        body: JSON.stringify(data)
      })
 
      if (result.success) {
        console.log('✅ Text scan data saved successfully via MongoDB API:', result.data)
        return result.data
      } else {
        throw new Error('Failed to save text scan data')
      }
    } catch (error) {
      console.error('❌ Failed to save text scan data via MongoDB API:', error)
      throw error
    }
  }
 
  /**
   * Save structured data from file upload
   */
  async saveFileUploadData(data: Omit<StructuredData, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('💾 Attempting to save file upload data via MongoDB API:', data)
      
      const result = await this.makeRequest<{
        success: boolean
        data: StructuredData
        message: string
      }>('/data/structured-data', {
        method: 'POST',
        body: JSON.stringify(data)
      })
 
      if (result.success) {
        console.log('✅ File upload data saved successfully via MongoDB API:', result.data)
        return result.data
      } else {
        throw new Error('Failed to save file upload data')
      }
    } catch (error) {
      console.error('❌ Failed to save file upload data via MongoDB API:', error)
      throw error
    }
  }
 
  /**
   * Get all structured data
   */
  async getAllStructuredData(limit: number = 100, skip: number = 0) {
    try {
      const result = await this.makeRequest<{
        success: boolean
        data: StructuredData[]
        count: number
        message: string
      }>(`/data/structured-data?limit=${limit}&skip=${skip}`)
 
      if (result.success) {
        console.log('✅ Structured data retrieved successfully via MongoDB API:', result.count, 'records')
        return result.data
      } else {
        throw new Error('Failed to get structured data')
      }
    } catch (error) {
      console.error('❌ Failed to get structured data via MongoDB API:', error)
      throw error
    }
  }
 
  /**
   * Get structured data by source
   */
  async getStructuredDataBySource(source: 'text_scan' | 'file_upload', limit: number = 100) {
    try {
      const result = await this.makeRequest<{
        success: boolean
        data: StructuredData[]
        count: number
        message: string
      }>(`/data/structured-data?source=${source}&limit=${limit}`)
 
      if (result.success) {
        console.log(`✅ Structured data for source '${source}' retrieved successfully via MongoDB API:`, result.count, 'records')
        return result.data
      } else {
        throw new Error('Failed to get structured data by source')
      }
    } catch (error) {
      console.error('❌ Failed to get structured data by source via MongoDB API:', error)
      throw error
    }
  }
 
  /**
   * Delete structured data
   */
  async deleteStructuredData(id: string) {
    try {
      const result = await this.makeRequest<{
        success: boolean
        message: string
      }>(`/data/structured-data/${id}`, {
        method: 'DELETE'
      })
 
      if (result.success) {
        console.log('✅ Structured data deleted successfully via MongoDB API')
        return true
      } else {
        throw new Error('Failed to delete structured data')
      }
    } catch (error) {
      console.error('❌ Failed to delete structured data via MongoDB API:', error)
      throw error
    }
  }
 
  // LinkedIn Companies Methods
  
  /**
   * Save LinkedIn company data
   */
  async saveLinkedInCompany(data: Omit<LinkedInCompany, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const result = await this.makeRequest<{
        success: boolean
        data: LinkedInCompany
        message: string
      }>('/data/linkedin-companies', {
        method: 'POST',
        body: JSON.stringify(data)
      })
 
      if (result.success) {
        console.log('✅ LinkedIn company data saved successfully via MongoDB API:', result.data)
        return result.data
      } else {
        throw new Error('Failed to save LinkedIn company data')
      }
    } catch (error) {
      console.error('❌ Failed to save LinkedIn company data via MongoDB API:', error)
      throw error
    }
  }
 
  /**
   * Get all LinkedIn companies
   */
  async getAllLinkedInCompanies(limit: number = 100, skip: number = 0): Promise<LinkedInCompany[]> {
    try {
      const result = await this.makeRequest<{
        success: boolean
        data: LinkedInCompany[]
        count: number
        message: string
      }>(`/data/linkedin-companies?limit=${limit}&skip=${skip}`)
 
      if (result.success) {
        console.log('✅ LinkedIn companies retrieved successfully via MongoDB API:', result.count, 'records')
        return result.data
      } else {
        throw new Error('Failed to get LinkedIn companies')
      }
    } catch (error) {
      console.error('❌ Failed to get LinkedIn companies via MongoDB API:', error)
      throw error
    }
  }
 
  /**
   * Get LinkedIn companies by industry
   */
  async getLinkedInCompaniesByIndustry(industry: string, limit: number = 100): Promise<LinkedInCompany[]> {
    try {
      const result = await this.makeRequest<{
        success: boolean
        data: LinkedInCompany[]
        count: number
        message: string
      }>(`/data/linkedin-companies?industry=${encodeURIComponent(industry)}&limit=${limit}`)
 
      if (result.success) {
        console.log(`✅ LinkedIn companies for industry '${industry}' retrieved successfully via MongoDB API:`, result.count, 'records')
        return result.data
      } else {
        throw new Error('Failed to get LinkedIn companies by industry')
      }
    } catch (error) {
      console.error('❌ Failed to get LinkedIn companies by industry via MongoDB API:', error)
      throw error
    }
  }
 
  /**
   * Search LinkedIn companies
   */
  async searchLinkedInCompanies(query: string, limit: number = 100): Promise<LinkedInCompany[]> {
    try {
      const result = await this.makeRequest<{
        success: boolean
        data: LinkedInCompany[]
        count: number
        message: string
      }>(`/data/linkedin-companies?search=${encodeURIComponent(query)}&limit=${limit}`)
 
      if (result.success) {
        console.log(`✅ LinkedIn companies search for '${query}' completed successfully via MongoDB API:`, result.count, 'records')
        return result.data
      } else {
        throw new Error('Failed to search LinkedIn companies')
      }
    } catch (error) {
      console.error('❌ Failed to search LinkedIn companies via MongoDB API:', error)
      throw error
    }
  }
 
  /**
   * Delete LinkedIn company
   */
  async deleteLinkedInCompany(id: string) {
    try {
      const result = await this.makeRequest<{
        success: boolean
        message: string
      }>(`/data/linkedin-companies/${id}`, {
        method: 'DELETE'
      })
 
      if (result.success) {
        console.log('✅ LinkedIn company deleted successfully via MongoDB API')
        return true
      } else {
        throw new Error('Failed to delete LinkedIn company')
      }
    } catch (error) {
      console.error('❌ Failed to delete LinkedIn company via MongoDB API:', error)
      throw error
    }
  }
 
  /**
   * Update LinkedIn company
   */
  async updateLinkedInCompany(id: string, data: Partial<LinkedInCompany>) {
    try {
      const result = await this.makeRequest<{
        success: boolean
        data: LinkedInCompany
        message: string
      }>(`/data/linkedin-companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
 
      if (result.success) {
        console.log('✅ LinkedIn company updated successfully via MongoDB API:', result.data)
        return result.data
      } else {
        throw new Error('Failed to update LinkedIn company')
      }
    } catch (error) {
      console.error('❌ Failed to update LinkedIn company via MongoDB API:', error)
      throw error
    }
  }
}
 
// Export singleton instance
export const mongodbService = new MongoDBService()
 
// For backward compatibility, also export as DatabaseService
export const DatabaseService = mongodbService
 