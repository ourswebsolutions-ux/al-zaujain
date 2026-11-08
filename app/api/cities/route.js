import { citiesInCountry } from '@/lib/places.js';

export async function GET(request) {
  const country = Number(request.nextUrl.searchParams.get('country'));
  if (!country) return Response.json({ cities: [] });
  return Response.json({ cities: (await citiesInCountry(country)).map((city) => city.name) });
}
