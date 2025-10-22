import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Debug logging
console.log('🔧 Supabase Configuration:')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing')
console.log('Environment variables loaded:', import.meta.env.VITE_SUPABASE_URL ? 'Yes' : 'No')

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface StructuredData {
  id?: number
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
  id?: number
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

// Database service
export class DatabaseService {
  // Save structured data from text scanning
  static async saveTextScanData(data: Omit<StructuredData, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: result, error } = await supabase
        .from('structured_data')
        .insert([{
          name: data.name,
          title: data.title,
          company: data.company,
          phone: data.phone,
          email: data.email,
          website: data.website,
          address: data.address,
          other_info: data.other_info,
          source: data.source,
          processing_method: data.processing_method,
          confidence_score: data.confidence_score,
          raw_text: data.raw_text
        }])
        .select()
        .single()

      if (error) {
        console.error('Error saving text scan data:', error)
        throw error
      }

      console.log('✅ Text scan data saved successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Failed to save text scan data:', error)
      throw error
    }
  }

  // Save structured data from file upload
  static async saveFileUploadData(data: Omit<StructuredData, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('💾 Attempting to save file upload data:', data)
      
      const { data: result, error } = await supabase
        .from('structured_data')
        .insert([{
          name: data.name,
          title: data.title,
          company: data.company,
          phone: data.phone,
          email: data.email,
          website: data.website,
          address: data.address,
          other_info: data.other_info,
          source: data.source,
          processing_method: data.processing_method,
          confidence_score: data.confidence_score,
          raw_text: data.raw_text
        }])
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error saving file upload data:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('✅ File upload data saved successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Failed to save file upload data:', error)
      throw error
    }
  }

  // Get all structured data
  static async getAllStructuredData() {
    try {
      const { data, error } = await supabase
        .from('structured_data')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching structured data:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('❌ Failed to fetch structured data:', error)
      throw error
    }
  }

  // Get structured data by source
  static async getStructuredDataBySource(source: 'text_scan' | 'file_upload') {
    try {
      const { data, error } = await supabase
        .from('structured_data')
        .select('*')
        .eq('source', source)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching structured data by source:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('❌ Failed to fetch structured data by source:', error)
      throw error
    }
  }

  // Delete structured data
  static async deleteStructuredData(id: number) {
    try {
      const { error } = await supabase
        .from('structured_data')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting structured data:', error)
        throw error
      }

      console.log('✅ Structured data deleted successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to delete structured data:', error)
      throw error
    }
  }

  // LinkedIn Companies Methods
  
  // Save LinkedIn company data
  static async saveLinkedInCompany(data: Omit<LinkedInCompany, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: savedData, error } = await supabase
        .from('linkedin_companies')
        .insert([data])
        .select()
        .single()

      if (error) {
        console.error('Error saving LinkedIn company data:', error)
        throw error
      }

      console.log('✅ LinkedIn company data saved successfully:', savedData)
      return savedData
    } catch (error) {
      console.error('❌ Failed to save LinkedIn company data:', error)
      throw error
    }
  }

  // Get all LinkedIn companies
  static async getAllLinkedInCompanies(): Promise<LinkedInCompany[]> {
    try {
      const { data, error } = await supabase
        .from('linkedin_companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching LinkedIn companies:', error)
        throw error
      }

      return data as LinkedInCompany[]
    } catch (error) {
      console.error('❌ Failed to fetch LinkedIn companies:', error)
      throw error
    }
  }

  // Get LinkedIn companies by industry
  static async getLinkedInCompaniesByIndustry(industry: string): Promise<LinkedInCompany[]> {
    try {
      const { data, error } = await supabase
        .from('linkedin_companies')
        .select('*')
        .ilike('industry', `%${industry}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching LinkedIn companies by industry:', error)
        throw error
      }

      return data as LinkedInCompany[]
    } catch (error) {
      console.error('❌ Failed to fetch LinkedIn companies by industry:', error)
      throw error
    }
  }

  // Search LinkedIn companies
  static async searchLinkedInCompanies(query: string): Promise<LinkedInCompany[]> {
    try {
      const { data, error } = await supabase
        .from('linkedin_companies')
        .select('*')
        .or(`company_name.ilike.%${query}%,industry.ilike.%${query}%,hq_location.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching LinkedIn companies:', error)
        throw error
      }

      return data as LinkedInCompany[]
    } catch (error) {
      console.error('❌ Failed to search LinkedIn companies:', error)
      throw error
    }
  }

  // Delete LinkedIn company
  static async deleteLinkedInCompany(id: number) {
    try {
      const { error } = await supabase
        .from('linkedin_companies')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting LinkedIn company:', error)
        throw error
      }

      console.log('✅ LinkedIn company deleted successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to delete LinkedIn company:', error)
      throw error
    }
  }

  // Update LinkedIn company
  static async updateLinkedInCompany(id: number, data: Partial<LinkedInCompany>) {
    try {
      const { data: updatedData, error } = await supabase
        .from('linkedin_companies')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating LinkedIn company:', error)
        throw error
      }

      console.log('✅ LinkedIn company updated successfully:', updatedData)
      return updatedData
    } catch (error) {
      console.error('❌ Failed to update LinkedIn company:', error)
      throw error
    }
  }
}