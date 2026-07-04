import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const SUPPORTED_CITIES_LOWER = [
  'chennai', 'bengaluru', 'bangalore', 'hyderabad', 'mumbai',
  'delhi', 'new delhi', 'pune', 'coimbatore', 'madurai',
  'kochi', 'jaipur'
]

function getFallbackCity(localityName: string | null, districtName: string | null, stateName: string | null) {
  const checkMatch = (name: string | null) => {
    if (!name) return null
    const norm = name.toLowerCase()
    if (SUPPORTED_CITIES_LOWER.includes(norm)) {
      if (norm === 'bangalore' || norm === 'bengaluru') return 'Bengaluru'
      if (norm === 'delhi' || norm === 'new delhi') return 'New Delhi'
      return norm.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
    return null
  }

  // Try locality first
  let matched = checkMatch(localityName)
  if (matched) return matched

  // Try district
  matched = checkMatch(districtName)
  if (matched) return matched

  // Fallback based on state
  if (stateName) {
    const stateLower = stateName.toLowerCase()
    if (stateLower.includes('tamil nadu')) return 'Chennai'
    if (stateLower.includes('karnataka')) return 'Bengaluru'
    if (stateLower.includes('telangana') || stateLower.includes('andhra')) return 'Hyderabad'
    if (stateLower.includes('maharashtra')) return 'Mumbai'
    if (stateLower.includes('delhi')) return 'New Delhi'
    if (stateLower.includes('rajasthan')) return 'Jaipur'
    if (stateLower.includes('kerala')) return 'Kochi'
  }

  return 'Chennai' // Ultimate fallback
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const latStr = searchParams.get('lat')
    const lngStr = searchParams.get('lng')

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude parameters are required' },
        { status: 400 }
      )
    }

    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'Invalid latitude or longitude values' },
        { status: 400 }
      )
    }

    // Round both to 3 decimal places
    const latRounded = lat.toFixed(3)
    const lngRounded = lng.toFixed(3)

    // Check LocationCache first
    const cached = await prisma.locationCache.findUnique({
      where: {
        latRounded_lngRounded: {
          latRounded,
          lngRounded
        }
      }
    })

    // Legacy cache records missing "|" separator are treated as invalid/expired to force fresh Google API query
    if (cached && cached.city.includes('|')) {
      const parts = cached.city.split('|')
      const area = parts[0] || null
      const city = parts[1]
      const fallbackCity = getFallbackCity(city, null, cached.state)

      return NextResponse.json({
        success: true,
        city: city,
        locality: fallbackCity,
        area: area,
        district: fallbackCity,
        state: cached.state,
        lat,
        lng
      })
    }

    // If no Google Maps API Key is configured, fallback to mock response for development
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.log('GOOGLE_MAPS_API_KEY not configured. Returning mock Chennai/Nanmangalam response.')
      return NextResponse.json({
        success: true,
        city: 'Chennai',
        locality: 'Chennai',
        area: 'Nanmangalam',
        district: 'Chennai',
        state: 'Tamil Nadu',
        lat,
        lng
      })
    }

    // Call Google Maps Geocoding API (broadened to include sublocality/neighborhood level)
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=en`
    const response = await fetch(geocodeUrl)
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Location service unavailable' },
        { status: 503 }
      )
    }

    const data = await response.json()

    if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'City not found' },
        { status: 404 }
      )
    }

    const result = data.results[0]
    let sublocality = ''
    let neighborhood = ''
    let locality = ''
    let district = ''
    let state = ''

    // Parse the response to extract address components
    for (const component of result.address_components) {
      if (component.types.includes('sublocality_level_1')) {
        sublocality = component.long_name
      }
      if (component.types.includes('neighborhood')) {
        neighborhood = component.long_name
      }
      if (component.types.includes('locality')) {
        locality = component.long_name
      }
      if (component.types.includes('administrative_area_level_2')) {
        district = component.long_name
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.long_name
      }
    }

    const detectedArea = sublocality || neighborhood || null
    const detectedCity = locality || district

    if (!detectedCity) {
      return NextResponse.json(
        { success: false, error: 'City not found' },
        { status: 404 }
      )
    }

    // Cache key/expiry structure unchanged, cache the richer data: "detectedArea|detectedCity" (always with separator)
    const cityToCache = `${detectedArea || ''}|${detectedCity}`

    // Save to cache (using upsert to avoid duplicate key issues if checked concurrently)
    await prisma.locationCache.upsert({
      where: {
        latRounded_lngRounded: {
          latRounded,
          lngRounded
        }
      },
      update: {
        city: cityToCache,
        state,
        country: 'India'
      },
      create: {
        latRounded,
        lngRounded,
        city: cityToCache,
        state,
        country: 'India'
      }
    }).catch(e => console.error('Failed to cache location:', e))

    const fallbackCity = getFallbackCity(detectedCity, district || locality || null, state)

    return NextResponse.json({
      success: true,
      city: detectedCity,
      locality: fallbackCity,
      area: detectedArea,
      district: fallbackCity,
      state,
      lat,
      lng
    })
  } catch (error: any) {
    console.error('Reverse geocoding route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
