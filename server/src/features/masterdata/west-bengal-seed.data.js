const fs = require('fs');
const path = require('path');

// Representative initial benchmark schools across major West Bengal districts & zones
const SAMPLE_BENCHMARK_SCHOOLS = [
  // Kolkata
  { name: "St. Xavier's Collegiate School", type: "PRIVATE", district: "Kolkata", zone: "Park Street", boardName: "ICSE" },
  { name: "Scottish Church Collegiate School", type: "PUBLIC", district: "Kolkata", zone: "Shyambazar", boardName: "State Board" },
  { name: "Hindu School", type: "PUBLIC", district: "Kolkata", zone: "College Street", boardName: "State Board" },
  { name: "Hare School", type: "PUBLIC", district: "Kolkata", zone: "College Street", boardName: "State Board" },
  { name: "South Point High School", type: "PRIVATE", district: "Kolkata", zone: "Ballyganj", boardName: "CBSE" },
  { name: "Ballygunge Government High School", type: "PUBLIC", district: "Kolkata", zone: "Ballyganj", boardName: "State Board" },
  { name: "Don Bosco School Park Circus", type: "PRIVATE", district: "Kolkata", zone: "Entaly", boardName: "ICSE" },
  { name: "Bethune Collegiate School", type: "PUBLIC", district: "Kolkata", zone: "Shyambazar", boardName: "State Board" },
  { name: "Behala High School", type: "PUBLIC", district: "Kolkata", zone: "Behala", boardName: "State Board" },
  { name: "Jadavpur Vidyapith", type: "PUBLIC", district: "Kolkata", zone: "Jadavpur", boardName: "State Board" },
  { name: "Dum Dum Kishore Bharati High School", type: "PUBLIC", district: "Kolkata", zone: "Dum Dum", boardName: "State Board" },

  // Howrah
  { name: "Howrah Zilla School", type: "PUBLIC", district: "Howrah", zone: "Howrah Maidan", boardName: "State Board" },
  { name: "Howrah Vivekananda Institution", type: "PUBLIC", district: "Howrah", zone: "Howrah Maidan", boardName: "State Board" },
  { name: "Bagnan High School", type: "PUBLIC", district: "Howrah", zone: "Bagnan", boardName: "State Board" },
  { name: "Amta Pitambar High School", type: "PUBLIC", district: "Howrah", zone: "Amta", boardName: "State Board" },
  { name: "Uluberia High School", type: "PUBLIC", district: "Howrah", zone: "Uluberia", boardName: "State Board" },

  // Hooghly
  { name: "Serampore Union Institution", type: "PUBLIC", district: "Hooghly", zone: "Serampore", boardName: "State Board" },
  { name: "Hooghly Collegiate School", type: "PUBLIC", district: "Hooghly", zone: "Chuchura", boardName: "State Board" },
  { name: "Chandannagar Kanailal Vidyamandir", type: "PUBLIC", district: "Hooghly", zone: "Chandannagar", boardName: "State Board" },
  { name: "Arambagh High School", type: "PUBLIC", district: "Hooghly", zone: "Arambagh", boardName: "State Board" },
  { name: "Bandel St. John's High School", type: "PRIVATE", district: "Hooghly", zone: "Bandel", boardName: "State Board" },

  // North 24 Parganas
  { name: "Barasat Government High School", type: "PUBLIC", district: "North 24 Parganas", zone: "BARASAT 1", boardName: "State Board" },
  { name: "Barrackpore Government High School", type: "PUBLIC", district: "North 24 Parganas", zone: "Barrackpore", boardName: "State Board" },
  { name: "Bidhannagar Government High School", type: "PUBLIC", district: "North 24 Parganas", zone: "Bidhannagar", boardName: "State Board" },
  { name: "Basirhat High School", type: "PUBLIC", district: "North 24 Parganas", zone: "Basirhat", boardName: "State Board" },
  { name: "Habra High School", type: "PUBLIC", district: "North 24 Parganas", zone: "Habra", boardName: "State Board" },
  { name: "Naihati Narendra Vidyaniketan", type: "PUBLIC", district: "North 24 Parganas", zone: "Naihati", boardName: "State Board" },

  // South 24 Parganas
  { name: "Baruipur High School", type: "PUBLIC", district: "South 24 Parganas", zone: "Baruipur", boardName: "State Board" },
  { name: "Diamond Harbour High School", type: "PUBLIC", district: "South 24 Parganas", zone: "Diamond Harbour", boardName: "State Board" },
  { name: "Canning David Sassoon High School", type: "PUBLIC", district: "South 24 Parganas", zone: "Canning", boardName: "State Board" },
  { name: "Budge Budge PK High School", type: "PUBLIC", district: "South 24 Parganas", zone: "Budge Budge", boardName: "State Board" },

  // Nadia
  { name: "Krishnanagar Collegiate School", type: "PUBLIC", district: "Nadia", zone: "Krishnanagar", boardName: "State Board" },
  { name: "Ranaghat Brojobala Girls High School", type: "PUBLIC", district: "Nadia", zone: "Ranaghat", boardName: "State Board" },
  { name: "Kalyani University Experimental High School", type: "PUBLIC", district: "Nadia", zone: "Kalyani", boardName: "State Board" },
  { name: "Santipur Oriental Academy", type: "PUBLIC", district: "Nadia", zone: "Santipur", boardName: "State Board" },

  // Murshidabad
  { name: "Berhampore Collegiate School", type: "PUBLIC", district: "Murshidabad", zone: "Berhampore1", boardName: "State Board" },
  { name: "Kandi Raj High School", type: "PUBLIC", district: "Murshidabad", zone: "Kandi", boardName: "State Board" },
  { name: "Jangipur High School", type: "PUBLIC", district: "Murshidabad", zone: "Jangipur", boardName: "State Board" },
  { name: "Lalbagh Singhi High School", type: "PUBLIC", district: "Murshidabad", zone: "Lalbagh", boardName: "State Board" },

  // Burdwan
  { name: "Burdwan Municipal High School", type: "PUBLIC", district: "Burdwan", zone: "Burdwan Town", boardName: "State Board" },
  { name: "Asansol Ramakrishna Mission High School", type: "PUBLIC", district: "Burdwan", zone: "Asansol", boardName: "State Board" },
  { name: "Durgapur Steel Plant High School", type: "PUBLIC", district: "Burdwan", zone: "Durgapur", boardName: "State Board" },
  { name: "Kalna Maharaja High School", type: "PUBLIC", district: "Burdwan", zone: "Kalna", boardName: "State Board" },

  // Malda
  { name: "Malda Zilla School", type: "PUBLIC", district: "Malda", zone: "Malda Town-1", boardName: "State Board" },
  { name: "Barlow Girls High School", type: "PUBLIC", district: "Malda", zone: "English Bazar", boardName: "State Board" },
  { name: "Chanchal Siddheswari Institution", type: "PUBLIC", district: "Malda", zone: "Chanchal", boardName: "State Board" },

  // North Bengal (Siliguri, Jalpaiguri, Cooch Behar, Alipurduar, Darjeeling)
  { name: "Siliguri Boys High School", type: "PUBLIC", district: "North Bengal", zone: "Siliguri Town", boardName: "State Board" },
  { name: "Jalpaiguri Zilla School", type: "PUBLIC", district: "North Bengal", zone: "Jalpaiguri Town", boardName: "State Board" },
  { name: "Jenkins School Cooch Behar", type: "PUBLIC", district: "North Bengal", zone: "Coochbehar Town", boardName: "State Board" },
  { name: "Darjeeling Government High School", type: "PUBLIC", district: "North Bengal", zone: "Darjeeling Town", boardName: "State Board" },
  { name: "Alipurduar McWilliam High School", type: "PUBLIC", district: "North Bengal", zone: "Alipurduar Town", boardName: "State Board" },

  // Bankura & Purulia & Medinipur
  { name: "Bankura Zilla School", type: "PUBLIC", district: "Bankura", zone: "Bankura Town", boardName: "State Board" },
  { name: "Bishnupur High School", type: "PUBLIC", district: "Bankura", zone: "Bishnupur", boardName: "State Board" },
  { name: "Purulia Zilla School", type: "PUBLIC", district: "Purulia", zone: "Purulia Town", boardName: "State Board" },
  { name: "Midnapore Collegiate School", type: "PUBLIC", district: "Paschim Medinipur", zone: "Midnapore Town", boardName: "State Board" },
  { name: "Tamluk Hamilton High School", type: "PUBLIC", district: "Purba Medinipur", zone: "Tamluk", boardName: "State Board" },
  { name: "Contai Model High School", type: "PUBLIC", district: "Purba Medinipur", zone: "Contai", boardName: "State Board" },
];

/**
 * Seed or verify West Bengal master data (districts, zones, and benchmark schools)
 * Source of districts & zones: canvee-09-2026-02.sql (access_location master table)
 */
async function seedWestBengalMasterData(prisma) {
  console.log('[WB-MasterData] Initializing West Bengal State, Districts, and Zones from official master copy...');

  // 1. Ensure State: West Bengal
  let state = await prisma.state.findFirst({
    where: { name: { equals: 'West Bengal', mode: 'insensitive' } },
  });

  if (!state) {
    state = await prisma.state.create({
      data: {
        name: 'West Bengal',
        code: 'WB',
        status: true,
      },
    });
    console.log(`[WB-MasterData] Created State: ${state.name} (${state.id})`);
  } else {
    console.log(`[WB-MasterData] Using existing State: ${state.name} (${state.id})`);
  }

  // 2. Ensure Boards exist
  let defaultBoard = await prisma.board.findFirst({
    where: { name: { in: ['State Board', 'WBBSE', 'CBSE'] } },
  });
  if (!defaultBoard) {
    defaultBoard = await prisma.board.create({
      data: { name: 'State Board', shortName: 'WBBSE', status: true },
    });
  }

  // 3. Load Locations JSON
  const jsonPath = path.join(__dirname, 'west-bengal-locations.json');
  let locationsData = {};
  if (fs.existsSync(jsonPath)) {
    locationsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  }

  let districtsCreated = 0;
  let zonesCreated = 0;
  let schoolsCreated = 0;

  // Map to hold district id by name
  const districtMap = {};

  for (const [districtName, zonesList] of Object.entries(locationsData)) {
    // Check if district exists
    let district = await prisma.district.findFirst({
      where: {
        stateId: state.id,
        name: { equals: districtName, mode: 'insensitive' },
      },
    });

    if (!district) {
      district = await prisma.district.create({
        data: {
          name: districtName,
          stateId: state.id,
        },
      });
      districtsCreated++;
    }
    districtMap[districtName.toLowerCase()] = district;

    // Seed zones for this district
    const existingZones = await prisma.zone.findMany({
      where: { districtId: district.id },
      select: { name: true },
    });
    const existingZoneNames = new Set(existingZones.map((z) => z.name.toLowerCase()));

    for (const zoneName of zonesList) {
      if (!existingZoneNames.has(zoneName.toLowerCase())) {
        try {
          await prisma.zone.create({
            data: {
              name: zoneName,
              districtId: district.id,
            },
          });
          zonesCreated++;
          existingZoneNames.add(zoneName.toLowerCase());
        } catch (e) {
          // ignore unique constraint collisions if any
        }
      }
    }
  }

  // 4. Seed initial benchmark schools for popular zones
  for (const s of SAMPLE_BENCHMARK_SCHOOLS) {
    const dist = districtMap[s.district.toLowerCase()];
    if (!dist) continue;

    // Find zone or fallback to first zone of district
    let zone = await prisma.zone.findFirst({
      where: {
        districtId: dist.id,
        name: { equals: s.zone, mode: 'insensitive' },
      },
    });

    if (!zone) {
      zone = await prisma.zone.findFirst({
        where: { districtId: dist.id },
      });
    }

    if (!zone) continue;

    // Check if school exists
    const existingSchool = await prisma.school.findFirst({
      where: {
        name: { equals: s.name, mode: 'insensitive' },
      },
    });

    if (!existingSchool) {
      try {
        await prisma.school.create({
          data: {
            name: s.name,
            type: s.type,
            address: `${s.zone}, ${dist.name}, West Bengal`,
            zoneId: zone.id,
            boardId: defaultBoard.id,
          },
        });
        schoolsCreated++;
      } catch (err) {
        // continue
      }
    }
  }

  console.log(
    `[WB-MasterData] Completed: ${districtsCreated} new districts, ${zonesCreated} new zones, ${schoolsCreated} new schools.`
  );

  return {
    stateId: state.id,
    stateName: state.name,
    districtsCreated,
    zonesCreated,
    schoolsCreated,
  };
}

module.exports = {
  seedWestBengalMasterData,
  SAMPLE_BENCHMARK_SCHOOLS,
};
