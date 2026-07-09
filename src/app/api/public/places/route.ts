import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const input = searchParams.get('input')
    const placeId = searchParams.get('placeId')
    const sessionToken = searchParams.get('sessionToken')

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.log('GOOGLE_MAPS_API_KEY not configured. Returning mock place data.')
      if (placeId) {
        return NextResponse.json({
          success: true,
          place: {
            id: placeId,
            formattedAddress: 'No. 15, Anna Nagar East, Chennai, Tamil Nadu 600102, India',
            addressComponents: [
              { longName: 'No. 15', types: ['street_number'] },
              { longName: 'Anna Nagar East', types: ['sublocality_level_1', 'sublocality'] },
              { longName: 'Chennai', types: ['locality'] },
              { longName: 'Tamil Nadu', types: ['administrative_area_level_1'] },
              { longName: 'India', types: ['country'] },
              { longName: '600102', types: ['postal_code'] }
            ],
            location: {
              latitude: 13.0850,
              longitude: 80.2101
            }
          }
        })
      }
      return NextResponse.json({
        success: true,
        predictions: [
          { text: 'No. 15, Anna Nagar East, Chennai, Tamil Nadu, India', placeId: 'mock_place_1' },
          { text: '16, Poes Road, Teynampet, Chennai, Tamil Nadu, India', placeId: 'mock_place_2' },
          { text: '42, Velachery Main Road, Velachery, Chennai, Tamil Nadu, India', placeId: 'mock_place_3' }
        ]
      })
    }

    if (placeId) {
      // Place Details (New). Autocomplete returns the full resource name
      // ("places/ChIJ..."); accept both that and a bare id without doubling it.
      const resource = placeId.startsWith('places/') ? placeId : `places/${placeId}`
      const url = `https://places.googleapis.com/v1/${resource}?sessionToken=${sessionToken}`
      const response = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          // Address-only fields keep this on the cheapest details tier. (Adding
          // websiteUri/phone would bump every lookup to the pricier Contact SKU.)
          'X-Goog-FieldMask': 'id,formattedAddress,addressComponents,location'
        }
      })
      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        console.error('Place details failed:', response.status, detail)
        return NextResponse.json({ success: false, error: 'Place details failed' }, { status: 200 })
      }
      const data = await response.json()
      return NextResponse.json({
        success: true,
        place: data
      })
    }

    if (input) {
      // Autocomplete (New)
      const url = `https://places.googleapis.com/v1/places:autocomplete`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey
        },
        body: JSON.stringify({
          input,
          sessionToken,
          includedRegionCodes: ['IN']
        })
      })
      if (!response.ok) {
        // Surface Google's real reason (e.g. "Places API (New) not enabled")
        // in logs, but degrade gracefully instead of 500-ing the address box.
        const detail = await response.text().catch(() => '')
        console.error('Places autocomplete failed:', response.status, detail)
        return NextResponse.json({ success: true, predictions: [] })
      }
      const data = await response.json()
      const predictions = (data.suggestions || []).map((s: any) => ({
        text: s.placePrediction?.text?.text || '',
        placeId: s.placePrediction?.place || ''
      }))
      return NextResponse.json({
        success: true,
        predictions
      })
    }

    return NextResponse.json({ success: false, error: 'Missing input or placeId' }, { status: 400 })
  } catch (error: any) {
    console.error('Places API error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
  }
}
