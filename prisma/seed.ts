import { prisma } from '../src/lib/db/client'

async function main() {
  console.log('Seeding database...')

  // STEP 1: Clean existing data
  console.log('Cleaning existing data...')
  
  await prisma.schoolReview.deleteMany()
  await prisma.parent.deleteMany()
  await prisma.locationCache.deleteMany()
  await prisma.school.deleteMany()
  await prisma.organizationModule.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.user.deleteMany({
    where: {
      OR: [
        { orgId: { not: null } },
        { email: 'vimal@techparrot.co' }
      ]
    }
  })
  await prisma.branch.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.planModule.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.module.deleteMany()
  await prisma.otpCode.deleteMany()
  await prisma.auditLog.deleteMany()

  // STEP 2: Create Modules (13 total)
  console.log('Creating modules...')
  const modulesData = [
    'lead_management',
    'admission_management',
    'student_management',
    'fee_management',
    'campaign_management',
    'advanced_reports',
    'payment_gateway',
    'whatsapp_sms_notifications',
    'forms_requests',
    'admission_workflow',
    'student_lifecycle',
    'api_access',
    'custom_domain'
  ]

  const modules = await Promise.all(
    modulesData.map((slug) =>
      prisma.module.create({
        data: {
          slug,
          name: slug
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          description: `Features for ${slug.replace(/_/g, ' ')}`
        }
      })
    )
  )

  // Seed whatsapp_addon module
  await prisma.module.create({
    data: {
      id: 'cmqxu0bcnr6us00009yha8q0n',
      name: 'WhatsApp',
      slug: 'whatsapp_addon',
      description: 'WhatsApp campaign sending via MSG91'
    }
  })

  // STEP 3: Create Plans (4 plans)
  console.log('Creating plans...')
  const freePlan = await prisma.plan.create({
    data: {
      name: 'Free',
      slug: 'free',
      monthlyPrice: 0,
      leadCap: 10,
      isPublic: true,
      sortOrder: 1
    }
  })

  const starterPlan = await prisma.plan.create({
    data: {
      name: 'Starter',
      slug: 'starter',
      monthlyPrice: 2999,
      leadCap: null,
      isPublic: true,
      sortOrder: 2
    }
  })

  const growthPlan = await prisma.plan.create({
    data: {
      name: 'Growth',
      slug: 'growth',
      monthlyPrice: 4999,
      leadCap: null,
      isPublic: true,
      sortOrder: 3
    }
  })

  const enterprisePlan = await prisma.plan.create({
    data: {
      name: 'Enterprise',
      slug: 'enterprise',
      monthlyPrice: 9999,
      leadCap: null,
      isPublic: true,
      sortOrder: 4
    }
  })

  // STEP 4: Create PlanModules
  console.log('Creating plan modules...')
  // Free plan gets only lead_management
  await prisma.planModule.createMany({
    data: [
      { planId: freePlan.id, moduleSlug: 'lead_management' }
    ]
  })

  // Starter plan gets: lead_management, admission_management, student_management
  await prisma.planModule.createMany({
    data: [
      { planId: starterPlan.id, moduleSlug: 'lead_management' },
      { planId: starterPlan.id, moduleSlug: 'admission_management' },
      { planId: starterPlan.id, moduleSlug: 'student_management' }
    ]
  })

  // Growth plan gets all modules except: api_access, custom_domain
  const growthSlugs = modulesData.filter(slug => slug !== 'api_access' && slug !== 'custom_domain')
  await prisma.planModule.createMany({
    data: growthSlugs.map(slug => ({
      planId: growthPlan.id,
      moduleSlug: slug
    }))
  })

  // Enterprise plan gets all 13 modules
  await prisma.planModule.createMany({
    data: modulesData.map(slug => ({
      planId: enterprisePlan.id,
      moduleSlug: slug
    }))
  })

  // STEP 5: Create Super Admin User
  console.log('Creating super admin...')
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Vimal Das',
      email: 'vimal@techparrot.co',
      phone: '9884185362',
      status: 'ACTIVE',
      orgId: null
    } as any
  })
  await prisma.userRoleAssignment.create({
    data: {
      userId: superAdmin.id,
      role: 'SUPER_ADMIN',
      orgId: null,
      status: 'ACTIVE',
      isDefault: true
    }
  })

  // STEP 6: Create Test Organization
  console.log('Creating test organization...')
  const testOrg = await prisma.organization.create({
    data: {
      name: 'Prince Matriculation School',
      slug: 'prince-matriculation-school',
      institutionType: 'SCHOOL',
      status: 'ACTIVE',
      email: 'admin@princematric.com',
      phone: '9884185361',
      planId: growthPlan.id,
      leadCap: 10,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  // STEP 7: Create Default Branch
  console.log('Creating default branch...')
  const mainBranch = await prisma.branch.create({
    data: {
      orgId: testOrg.id,
      name: 'Main Branch',
      isDefault: true,
      city: 'Chennai',
      state: 'Tamil Nadu'
    }
  })

  // STEP 8: Create Org Admin User
  console.log('Creating org admin user...')
  const saran = await prisma.user.create({
    data: {
      name: 'Saran Kumar',
      email: 'saran@princematric.com',
      phone: '9845000001',
      status: 'ACTIVE',
      orgId: testOrg.id
    } as any
  })
  await prisma.userRoleAssignment.create({
    data: {
      userId: saran.id,
      role: 'ORG_ADMIN',
      orgId: testOrg.id,
      status: 'ACTIVE',
      isDefault: true
    }
  })

  // STEP 9: Create Counsellors
  console.log('Creating counsellors...')
  const pradeep = await prisma.user.create({
    data: {
      name: 'Pradeep Kumar',
      email: 'pradeep@princematric.com',
      phone: '9845000002',
      status: 'ACTIVE',
      orgId: testOrg.id
    } as any
  })
  await prisma.userRoleAssignment.create({
    data: {
      userId: pradeep.id,
      role: 'COUNSELLOR',
      orgId: testOrg.id,
      status: 'ACTIVE',
      isDefault: true
    }
  })

  const vimalCounsellor = await prisma.user.create({
    data: {
      name: 'Vimal Das',
      email: 'vimal@princematric.com',
      phone: '9845000003',
      status: 'ACTIVE',
      orgId: testOrg.id
    } as any
  })
  await prisma.userRoleAssignment.create({
    data: {
      userId: vimalCounsellor.id,
      role: 'COUNSELLOR',
      orgId: testOrg.id,
      status: 'ACTIVE',
      isDefault: true
    }
  })

  // STEP 10: Enable Growth Modules for Test Org
  console.log('Enabling growth modules for test organization...')
  await prisma.organizationModule.createMany({
    data: growthSlugs.map(slug => {
      const mod = modules.find(m => m.slug === slug)
      return {
        orgId: testOrg.id,
        moduleId: mod!.id,
        enabled: true
      }
    })
  })

  // STEP 11: Create Academic Year
  console.log('Creating academic year...')
  const academicYear = await prisma.academicYear.create({
    data: {
      orgId: testOrg.id,
      name: 'AY 2026-27',
      type: 'ACADEMIC',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'ACTIVE'
    }
  })

  // STEP 12: Create Admission Stages (8 stages)
  console.log('Creating admission stages...')
  await prisma.admissionStage.createMany({
    data: [
      {
        orgId: testOrg.id,
        name: 'New',
        sortOrder: 1,
        color: 'blue',
        isWon: false,
        isLost: false,
        requiresDocs: false,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Contacted',
        sortOrder: 2,
        color: 'amber',
        isWon: false,
        isLost: false,
        requiresDocs: false,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Application Submitted',
        sortOrder: 3,
        color: 'indigo',
        isWon: false,
        isLost: false,
        requiresDocs: false,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Docs Uploaded',
        sortOrder: 4,
        color: 'violet',
        isWon: false,
        isLost: false,
        requiresDocs: true,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Interview Scheduled',
        sortOrder: 5,
        color: 'cyan',
        isWon: false,
        isLost: false,
        requiresDocs: false,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Payment Pending',
        sortOrder: 6,
        color: 'orange',
        isWon: false,
        isLost: false,
        requiresDocs: false,
        requiresPayment: true
      },
      {
        orgId: testOrg.id,
        name: 'Admitted',
        sortOrder: 7,
        color: 'green',
        isWon: true,
        isLost: false,
        requiresDocs: false,
        requiresPayment: false
      },
      {
        orgId: testOrg.id,
        name: 'Rejected',
        sortOrder: 8,
        color: 'red',
        isWon: false,
        isLost: true,
        requiresDocs: false,
        requiresPayment: false
      }
    ]
  })

  // STEP 13: Create Sample School in marketplace schema
  console.log('Creating sample school in marketplace...')
  const school = await prisma.school.create({
    data: {
      orgId: testOrg.id,
      name: 'Prince Matriculation School',
      slug: 'prince-matriculation-school',
      institutionType: 'SCHOOL',
      verificationStatus: 'VERIFIED',
      isVerified: true,
      admissionOpen: true,
      profileCompletion: 85,
      rankingScore: 82,
      description: "Prince Matriculation School is a premier educational institution in Chennai established in 1998. We offer world-class education from LKG to Class 12 with a focus on holistic development of every student.",
      establishedYear: 1998,
      totalStudents: 1200,
      totalTeachers: 68,
      mediumOfInstruction: "English",
      schoolType: "PRIVATE",
      gender: "CO_ED",
      gradesOffered: "LKG to Class 12",
      isManagedBySchool: true,
      isPublished: true,
      isClaimed: true,
      avgRating: 4.5,
      reviewCount: 24,
      responseRatePct: 92,
      avgResponseHours: 4,
      viewCount: 142,
      enquiryCount: 38,
      dataSource: "MANUAL",
      locations: {
        create: [
          {
            orgId: testOrg.id,
            addressLine: "No. 15, Anna Nagar East",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600102",
            latitude: 13.0850,
            longitude: 80.2101,
            isPrimary: true
          }
        ]
      },
      contacts: {
        create: [
          {
            orgId: testOrg.id,
            type: "phone",
            value: "044-26211234",
            isPrimary: true
          },
          {
            orgId: testOrg.id,
            type: "email",
            value: "admin@princematric.com",
            isPrimary: true
          },
          {
            orgId: testOrg.id,
            type: "website",
            value: "www.princematric.com",
            isPrimary: true
          }
        ]
      },
      affiliations: {
        create: [
          {
            orgId: testOrg.id,
            board: "Tamil Nadu State Board",
            affiliationNo: "TN-2345-MAT"
          }
        ]
      }
    }
  })

  // STEP 14: Add sample leads (5 leads)
  console.log('Creating sample leads...')
  await prisma.lead.createMany({
    data: [
      {
        orgId: testOrg.id,
        branchId: mainBranch.id,
        academicYearId: academicYear.id,
        leadCode: 'LD-2026-00001',
        parentName: 'Aravind Swamy',
        phone: '9840111111',
        email: 'aravind@gmail.com',
        kidName: 'Aditya Swamy',
        gradeSought: 'Grade 1',
        source: 'VIDHYAAN',
        status: 'NEW',
        priority: 'HIGH',
        assignedToId: pradeep.id
      },
      {
        orgId: testOrg.id,
        branchId: mainBranch.id,
        academicYearId: academicYear.id,
        leadCode: 'LD-2026-00002',
        parentName: 'Meera Krishnan',
        phone: '9840222222',
        email: 'meera@gmail.com',
        kidName: 'Sanjay Krishnan',
        gradeSought: 'Grade 3',
        source: 'WALK_IN',
        status: 'CONTACTED',
        priority: 'MEDIUM',
        assignedToId: vimalCounsellor.id
      },
      {
        orgId: testOrg.id,
        branchId: mainBranch.id,
        academicYearId: academicYear.id,
        leadCode: 'LD-2026-00003',
        parentName: 'Rajesh Kumar',
        phone: '9840333333',
        email: 'rajesh@gmail.com',
        kidName: 'Rahul Kumar',
        gradeSought: 'Grade 5',
        source: 'PHONE',
        status: 'INTERESTED',
        priority: 'LOW',
        assignedToId: pradeep.id
      },
      {
        orgId: testOrg.id,
        branchId: mainBranch.id,
        academicYearId: academicYear.id,
        leadCode: 'LD-2026-00004',
        parentName: 'Sangeetha Bala',
        phone: '9840444444',
        email: 'sangeetha@gmail.com',
        kidName: 'Nisha Bala',
        gradeSought: 'Grade 2',
        source: 'REFERRAL',
        status: 'FOLLOW_UP_PENDING',
        priority: 'MEDIUM',
        assignedToId: vimalCounsellor.id
      },
      {
        orgId: testOrg.id,
        branchId: mainBranch.id,
        academicYearId: academicYear.id,
        leadCode: 'LD-2026-00005',
        parentName: 'Vijay Raghavan',
        phone: '9840555555',
        email: 'vijay@gmail.com',
        kidName: 'Ananya Raghavan',
        gradeSought: 'Kindergarten',
        source: 'WEBSITE',
        status: 'CONVERTED',
        priority: 'HIGH',
        assignedToId: pradeep.id
      }
    ]
  })

  // STEP 15: Create 4 More Schools in marketplace schema
  console.log('Creating 4 additional schools in marketplace...')
  
  // SCHOOL 2
  const school2Org = await prisma.organization.create({
    data: {
      name: "Agurchand Manmull Jain School",
      slug: "agurchand-manmull-jain-school",
      institutionType: "SCHOOL",
      status: "ACTIVE",
      email: "admin@amjainschool.com",
      phone: "9845000010",
      planId: growthPlan.id,
      leadCap: 10
    }
  })
  const school2 = await prisma.school.create({
    data: {
      orgId: school2Org.id,
      name: "Agurchand Manmull Jain School",
      slug: "agurchand-manmull-jain-school",
      institutionType: "SCHOOL",
      description: "One of Chennai's oldest and most respected schools, AMJAIN has been nurturing young minds since 1956. Known for academic excellence and strong value systems.",
      establishedYear: 1956,
      totalStudents: 2400,
      totalTeachers: 120,
      schoolType: "PRIVATE",
      gender: "CO_ED",
      gradesOffered: "LKG to Class 12",
      admissionOpen: true,
      isVerified: true,
      isManagedBySchool: true,
      isPublished: true,
      isClaimed: true,
      avgRating: 4.3,
      reviewCount: 89,
      viewCount: 320,
      enquiryCount: 67,
      rankingScore: 88,
      profileCompletion: 90,
      locations: {
        create: [
          {
            orgId: school2Org.id,
            addressLine: "16, Poes Road, Teynampet",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600018",
            latitude: 13.0375,
            longitude: 80.2523,
            isPrimary: true
          }
        ]
      },
      affiliations: {
        create: [
          {
            orgId: school2Org.id,
            board: "State Board",
            affiliationNo: "TN-1956-HSS"
          }
        ]
      }
    }
  })

  // SCHOOL 3
  const school3Org = await prisma.organization.create({
    data: {
      name: "Baalyaa Senior Secondary School",
      slug: "baalyaa-senior-secondary-school",
      institutionType: "SCHOOL",
      status: "ACTIVE",
      email: "admin@baalyaaschool.com",
      phone: "9845000011",
      planId: growthPlan.id,
      leadCap: 10
    }
  })
  const school3 = await prisma.school.create({
    data: {
      orgId: school3Org.id,
      name: "Baalyaa Senior Secondary School",
      slug: "baalyaa-senior-secondary-school",
      institutionType: "SCHOOL",
      description: "Baalyaa Senior Secondary School provides quality CBSE education with modern infrastructure and experienced faculty. Committed to developing future leaders.",
      establishedYear: 2005,
      totalStudents: 850,
      totalTeachers: 48,
      schoolType: "PRIVATE",
      gender: "CO_ED",
      gradesOffered: "Nursery to Class 12",
      admissionOpen: true,
      isVerified: true,
      isManagedBySchool: false,
      isPublished: true,
      isClaimed: true,
      avgRating: 4.1,
      reviewCount: 42,
      viewCount: 186,
      enquiryCount: 31,
      rankingScore: 72,
      profileCompletion: 75,
      locations: {
        create: [
          {
            orgId: school3Org.id,
            addressLine: "42, Velachery Main Road",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600042",
            latitude: 12.9816,
            longitude: 80.2180,
            isPrimary: true
          }
        ]
      },
      affiliations: {
        create: [
          {
            orgId: school3Org.id,
            board: "CBSE",
            affiliationNo: "CB-1230456"
          }
        ]
      }
    }
  })

  // SCHOOL 4
  const school4Org = await prisma.organization.create({
    data: {
      name: "Akshaya Matriculation School",
      slug: "akshaya-matriculation-school",
      institutionType: "SCHOOL",
      status: "ACTIVE",
      email: "admin@akshayaschool.com",
      phone: "9845000012",
      planId: growthPlan.id,
      leadCap: 10
    }
  })
  const school4 = await prisma.school.create({
    data: {
      orgId: school4Org.id,
      name: "Akshaya Matriculation School",
      slug: "akshaya-matriculation-school",
      institutionType: "SCHOOL",
      description: "Akshaya Matriculation School offers a nurturing environment for students from LKG to Class 10. Strong focus on Tamil culture and modern education techniques.",
      establishedYear: 2010,
      totalStudents: 620,
      totalTeachers: 35,
      schoolType: "PRIVATE",
      gender: "CO_ED",
      gradesOffered: "LKG to Class 10",
      admissionOpen: false,
      isVerified: true,
      isManagedBySchool: true,
      isPublished: true,
      isClaimed: true,
      avgRating: 3.9,
      reviewCount: 28,
      viewCount: 98,
      enquiryCount: 14,
      rankingScore: 65,
      profileCompletion: 70,
      locations: {
        create: [
          {
            orgId: school4Org.id,
            addressLine: "8, Tambaram West Main Road",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600045",
            latitude: 12.9249,
            longitude: 80.1000,
            isPrimary: true
          }
        ]
      },
      affiliations: {
        create: [
          {
            orgId: school4Org.id,
            board: "State Board",
            affiliationNo: "TN-2010-MAT"
          }
        ]
      }
    }
  })

  // SCHOOL 5
  const school5Org = await prisma.organization.create({
    data: {
      name: "The PSBB Millennium School",
      slug: "psbb-millennium-school",
      institutionType: "SCHOOL",
      status: "ACTIVE",
      email: "admin@psbbmillennium.com",
      phone: "9845000013",
      planId: growthPlan.id,
      leadCap: 10
    }
  })
  const school5 = await prisma.school.create({
    data: {
      orgId: school5Org.id,
      name: "The PSBB Millennium School",
      slug: "psbb-millennium-school",
      institutionType: "SCHOOL",
      description: "PSBB Millennium is a premium CBSE school known for its excellent academic results and diverse co-curricular activities. Part of the prestigious PSBB group.",
      establishedYear: 2000,
      totalStudents: 3200,
      totalTeachers: 180,
      schoolType: "PRIVATE",
      gender: "CO_ED",
      gradesOffered: "LKG to Class 12",
      admissionOpen: true,
      isVerified: true,
      isManagedBySchool: true,
      isPublished: true,
      isClaimed: true,
      avgRating: 4.7,
      reviewCount: 215,
      viewCount: 892,
      enquiryCount: 143,
      rankingScore: 95,
      profileCompletion: 98,
      locations: {
        create: [
          {
            orgId: school5Org.id,
            addressLine: "Old Mahabalipuram Road, Sholinganallur",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600119",
            latitude: 12.9010,
            longitude: 80.2279,
            isPrimary: true
          }
        ]
      },
      affiliations: {
        create: [
          {
            orgId: school5Org.id,
            board: "CBSE",
            affiliationNo: "CB-1198765"
          }
        ]
      }
    }
  })

  // STEP 16: Create 6 Learning Centers in marketplace schema
  console.log('Creating 6 learning centers in marketplace...')

  // LC 1
  const lc1Org = await prisma.organization.create({
    data: {
      name: "Kalakshetra Dance Academy",
      slug: "kalakshetra-dance-academy",
      institutionType: "LEARNING_CENTER",
      status: "ACTIVE",
      email: "info@kalakshetra.com",
      phone: "9884123456",
      planId: growthPlan.id,
      leadCap: 10
    }
  })
  const lc1 = await prisma.school.create({
    data: {
      orgId: lc1Org.id,
      name: "Kalakshetra Dance Academy",
      slug: "kalakshetra-dance-academy",
      institutionType: "LEARNING_CENTER",
      description: "Kalakshetra Dance Academy is Chennai's premier classical dance institution. We offer training in Bharatanatyam, Kuchipudi and Western dance forms for all age groups under expert guidance.",
      establishedYear: 2008,
      totalStudents: 180,
      activityTypes: ["DANCE", "PERFORMING_ARTS"],
      trialClassAvailable: true,
      enrollmentStatus: "OPEN",
      ageGroupMin: 5,
      ageGroupMax: 35,
      monthlyFeeMin: 1500,
      monthlyFeeMax: 2500,
      isVerified: true,
      isManagedBySchool: true,
      isPublished: true,
      isClaimed: true,
      admissionOpen: true,
      avgRating: 4.9,
      reviewCount: 120,
      viewCount: 340,
      enquiryCount: 58,
      rankingScore: 92,
      profileCompletion: 95,
      locations: {
        create: [
          {
            orgId: lc1Org.id,
            addressLine: "23, Luz Avenue, Mylapore",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600004",
            latitude: 13.0418,
            longitude: 80.2672,
            isPrimary: true
          }
        ]
      },
      contacts: {
        create: [
          {
            orgId: lc1Org.id,
            type: "phone",
            value: "9884123456",
            isPrimary: true
          },
          {
            orgId: lc1Org.id,
            type: "email",
            value: "info@kalakshetra.com",
            isPrimary: true
          }
        ]
      },
      batchSchedules: {
        create: [
          {
            orgId: lc1Org.id,
            activityName: "Bharatanatyam - Beginners",
            batchName: "Weekend Beginners",
            daysOfWeek: ["SATURDAY", "SUNDAY"],
            startTime: "09:00",
            endTime: "11:00",
            ageGroupMin: 5,
            ageGroupMax: 12,
            monthlyFee: 1500,
            capacity: 15,
            enrolledCount: 12,
            gender: "ALL",
            isActive: true
          },
          {
            orgId: lc1Org.id,
            activityName: "Bharatanatyam - Advanced",
            batchName: "Weekday Advanced",
            daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"],
            startTime: "17:00",
            endTime: "19:00",
            ageGroupMin: 13,
            ageGroupMax: 35,
            monthlyFee: 2500,
            capacity: 12,
            enrolledCount: 10,
            gender: "ALL",
            isActive: true
          }
        ]
      },
      instructors: {
        create: [
          {
            orgId: lc1Org.id,
            name: "Smt. Radha Krishnamurthy",
            qualification: "M.A. Dance, Kalakshetra Graduate",
            specialization: "Bharatanatyam",
            experienceYears: 20,
            bio: "Award-winning Bharatanatyam artist with 20 years of teaching experience. Trained under Guru Padma Subrahmanyam.",
            isActive: true
          },
          {
            orgId: lc1Org.id,
            name: "Ms. Preethi Sharma",
            qualification: "Diploma in Western Dance",
            specialization: "Western Contemporary",
            experienceYears: 8,
            bio: "Certified Western dance instructor specializing in contemporary, jazz and hip-hop dance forms.",
            isActive: true
          }
        ]
      }
    }
  })

  // LC 2
  const lc2Org = await prisma.organization.create({
    data: {
      name: "Swara Music Institute",
      slug: "swara-music-institute",
      institutionType: "LEARNING_CENTER",
      status: "ACTIVE",
      email: "info@swaramusic.com",
      phone: "9845000020",
      planId: growthPlan.id,
      leadCap: 10
    }
  })
  const lc2 = await prisma.school.create({
    data: {
      orgId: lc2Org.id,
      name: "Swara Music Institute",
      slug: "swara-music-institute",
      institutionType: "LEARNING_CENTER",
      description: "Swara Music Institute offers comprehensive music education in Carnatic classical, Western music and instrument training. Our experienced faculty nurtures musical talent from beginners to advanced levels.",
      establishedYear: 2012,
      totalStudents: 145,
      activityTypes: ["MUSIC"],
      trialClassAvailable: true,
      enrollmentStatus: "OPEN",
      ageGroupMin: 4,
      ageGroupMax: 60,
      monthlyFeeMin: 1200,
      monthlyFeeMax: 2000,
      isVerified: true,
      isManagedBySchool: true,
      isPublished: true,
      isClaimed: true,
      admissionOpen: true,
      avgRating: 4.8,
      reviewCount: 95,
      viewCount: 278,
      enquiryCount: 42,
      rankingScore: 88,
      profileCompletion: 90,
      locations: {
        create: [
          {
            orgId: lc2Org.id,
            addressLine: "45, T Nagar Main Road",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600017",
            latitude: 13.0418,
            longitude: 80.2341,
            isPrimary: true
          }
        ]
      },
      contacts: {
        create: [
          {
            orgId: lc2Org.id,
            type: "phone",
            value: "9845000020",
            isPrimary: true
          }
        ]
      },
      batchSchedules: {
        create: [
          {
            orgId: lc2Org.id,
            activityName: "Carnatic Vocal",
            batchName: "Evening Carnatic",
            daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"],
            startTime: "17:00",
            endTime: "18:30",
            ageGroupMin: 4,
            ageGroupMax: 60,
            monthlyFee: 1200,
            capacity: 10,
            enrolledCount: 8,
            gender: "ALL",
            isActive: true
          },
          {
            orgId: lc2Org.id,
            activityName: "Guitar - Western",
            batchName: "Weekend Guitar",
            daysOfWeek: ["SATURDAY"],
            startTime: "10:00",
            endTime: "12:00",
            ageGroupMin: 8,
            ageGroupMax: 40,
            monthlyFee: 2000,
            capacity: 8,
            enrolledCount: 6,
            gender: "ALL",
            isActive: true
          }
        ]
      }
    }
  })

  // LC 3
  const lc3Org = await prisma.organization.create({
    data: {
      name: "Creative Strokes Art Studio",
      slug: "creative-strokes-art-studio",
      institutionType: "LEARNING_CENTER",
      status: "ACTIVE",
      email: "info@creativestrokes.com",
      phone: "9845000021",
      planId: growthPlan.id,
      leadCap: 10
    }
  })
  const lc3 = await prisma.school.create({
    data: {
      orgId: lc3Org.id,
      name: "Creative Strokes Art Studio",
      slug: "creative-strokes-art-studio",
      institutionType: "LEARNING_CENTER",
      description: "Creative Strokes Art Studio is a vibrant space for young artists to explore their creativity. We offer classes in drawing, painting, pottery and digital art for children and adults.",
      establishedYear: 2015,
      totalStudents: 95,
      activityTypes: ["ART", "CRAFT"],
      trialClassAvailable: false,
      enrollmentStatus: "OPEN",
      ageGroupMin: 6,
      ageGroupMax: 30,
      monthlyFeeMin: 1000,
      monthlyFeeMax: 1800,
      isVerified: true,
      isManagedBySchool: false,
      isPublished: true,
      isClaimed: true,
      admissionOpen: true,
      avgRating: 4.6,
      reviewCount: 67,
      viewCount: 195,
      enquiryCount: 28,
      rankingScore: 78,
      profileCompletion: 80,
      locations: {
        create: [
          {
            orgId: lc3Org.id,
            addressLine: "12, Adyar Bridge Road",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600020",
            latitude: 13.0012,
            longitude: 80.2565,
            isPrimary: true
          }
        ]
      },
      batchSchedules: {
        create: [
          {
            orgId: lc3Org.id,
            activityName: "Drawing & Painting",
            batchName: "Kids Art Class",
            daysOfWeek: ["TUESDAY", "THURSDAY", "SATURDAY"],
            startTime: "16:00",
            endTime: "18:00",
            ageGroupMin: 6,
            ageGroupMax: 14,
            monthlyFee: 1000,
            capacity: 12,
            enrolledCount: 10,
            gender: "ALL",
            isActive: true
          }
        ]
      }
    }
  })

  // LC 4
  const lc4Org = await prisma.organization.create({
    data: {
      name: "FitKids Sports Academy",
      slug: "fitkids-sports-academy",
      institutionType: "LEARNING_CENTER",
      status: "ACTIVE",
      email: "info@fitkidssports.com",
      phone: "9845000022",
      planId: growthPlan.id,
      leadCap: 10
    }
  })
  const lc4 = await prisma.school.create({
    data: {
      orgId: lc4Org.id,
      name: "FitKids Sports Academy",
      slug: "fitkids-sports-academy",
      institutionType: "LEARNING_CENTER",
      description: "FitKids Sports Academy provides professional sports training in football, basketball, swimming and yoga. Our certified coaches develop physical fitness, team spirit and competitive skills in children.",
      establishedYear: 2016,
      totalStudents: 220,
      activityTypes: ["FITNESS", "SPORTS"],
      trialClassAvailable: true,
      enrollmentStatus: "OPEN",
      ageGroupMin: 6,
      ageGroupMax: 18,
      monthlyFeeMin: 2000,
      monthlyFeeMax: 3500,
      isVerified: true,
      isManagedBySchool: true,
      isPublished: true,
      isClaimed: true,
      admissionOpen: true,
      avgRating: 4.7,
      reviewCount: 88,
      viewCount: 412,
      enquiryCount: 72,
      rankingScore: 85,
      profileCompletion: 88,
      locations: {
        create: [
          {
            orgId: lc4Org.id,
            addressLine: "Sports Complex, OMR Road, Perungudi",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600096",
            latitude: 12.9636,
            longitude: 80.2417,
            isPrimary: true
          }
        ]
      },
      batchSchedules: {
        create: [
          {
            orgId: lc4Org.id,
            activityName: "Football Training",
            batchName: "Evening Football",
            daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"],
            startTime: "18:00",
            endTime: "20:00",
            ageGroupMin: 8,
            ageGroupMax: 16,
            monthlyFee: 2500,
            capacity: 20,
            enrolledCount: 18,
            gender: "ALL",
            isActive: true
          },
          {
            orgId: lc4Org.id,
            activityName: "Yoga for Kids",
            batchName: "Morning Yoga",
            daysOfWeek: ["SATURDAY", "SUNDAY"],
            startTime: "07:00",
            endTime: "08:30",
            ageGroupMin: 6,
            ageGroupMax: 18,
            monthlyFee: 2000,
            capacity: 15,
            enrolledCount: 11,
            gender: "ALL",
            isActive: true
          }
        ]
      }
    }
  })

  // LC 5
  const lc5Org = await prisma.organization.create({
    data: {
      name: "BrightMinds Coaching Center",
      slug: "brightminds-coaching-center",
      institutionType: "LEARNING_CENTER",
      status: "ACTIVE",
      email: "info@brightminds.com",
      phone: "9845000023",
      planId: growthPlan.id,
      leadCap: 10
    }
  })
  const lc5 = await prisma.school.create({
    data: {
      orgId: lc5Org.id,
      name: "BrightMinds Coaching Center",
      slug: "brightminds-coaching-center",
      institutionType: "LEARNING_CENTER",
      description: "BrightMinds is Chennai's most trusted academic coaching center for competitive exam preparation. Expert faculty with proven track record in NEET, JEE and Board exam preparation with personalized attention.",
      establishedYear: 2011,
      totalStudents: 380,
      activityTypes: ["ACADEMIC_COACHING"],
      trialClassAvailable: false,
      enrollmentStatus: "OPEN",
      ageGroupMin: 11,
      ageGroupMax: 18,
      monthlyFeeMin: 2500,
      monthlyFeeMax: 5000,
      isVerified: true,
      isManagedBySchool: true,
      isPublished: true,
      isClaimed: true,
      admissionOpen: true,
      avgRating: 4.7,
      reviewCount: 210,
      viewCount: 654,
      enquiryCount: 124,
      rankingScore: 90,
      profileCompletion: 92,
      locations: {
        create: [
          {
            orgId: lc5Org.id,
            addressLine: "78, Anna Nagar West",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600040",
            latitude: 13.0850,
            longitude: 80.2101,
            isPrimary: true
          }
        ]
      },
      batchSchedules: {
        create: [
          {
            orgId: lc5Org.id,
            activityName: "NEET Preparation",
            batchName: "Class 11 NEET Batch",
            daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
            startTime: "16:00",
            endTime: "19:00",
            ageGroupMin: 16,
            ageGroupMax: 18,
            monthlyFee: 5000,
            capacity: 30,
            enrolledCount: 28,
            gender: "ALL",
            isActive: true
          },
          {
            orgId: lc5Org.id,
            activityName: "Board Exam Coaching",
            batchName: "Class 10 Board Prep",
            daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY", "SATURDAY"],
            startTime: "16:00",
            endTime: "18:00",
            ageGroupMin: 15,
            ageGroupMax: 16,
            monthlyFee: 2500,
            capacity: 25,
            enrolledCount: 22,
            gender: "ALL",
            isActive: true
          }
        ]
      }
    }
  })

  // LC 6
  const lc6Org = await prisma.organization.create({
    data: {
      name: "CodeKids Technology Academy",
      slug: "codekids-technology-academy",
      institutionType: "LEARNING_CENTER",
      status: "ACTIVE",
      email: "info@codekids.com",
      phone: "9845000024",
      planId: growthPlan.id,
      leadCap: 10
    }
  })
  const lc6 = await prisma.school.create({
    data: {
      orgId: lc6Org.id,
      name: "CodeKids Technology Academy",
      slug: "codekids-technology-academy",
      institutionType: "LEARNING_CENTER",
      description: "CodeKids Technology Academy teaches coding, robotics and AI to children in a fun and engaging way. Our project-based curriculum prepares young learners for the technology driven future.",
      establishedYear: 2018,
      totalStudents: 145,
      activityTypes: ["CODING", "TECHNOLOGY"],
      trialClassAvailable: true,
      enrollmentStatus: "OPEN",
      ageGroupMin: 7,
      ageGroupMax: 16,
      monthlyFeeMin: 3000,
      monthlyFeeMax: 4500,
      isVerified: true,
      isManagedBySchool: false,
      isPublished: true,
      isClaimed: true,
      admissionOpen: true,
      avgRating: 4.8,
      reviewCount: 88,
      viewCount: 298,
      enquiryCount: 52,
      rankingScore: 86,
      profileCompletion: 85,
      locations: {
        create: [
          {
            orgId: lc6Org.id,
            addressLine: "34, Nungambakkam High Road",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600034",
            latitude: 13.0569,
            longitude: 80.2425,
            isPrimary: true
          }
        ]
      },
      batchSchedules: {
        create: [
          {
            orgId: lc6Org.id,
            activityName: "Python Programming",
            batchName: "Weekend Coding Batch",
            daysOfWeek: ["SATURDAY", "SUNDAY"],
            startTime: "10:00",
            endTime: "12:00",
            ageGroupMin: 10,
            ageGroupMax: 16,
            monthlyFee: 4000,
            capacity: 12,
            enrolledCount: 10,
            gender: "ALL",
            isActive: true
          },
          {
            orgId: lc6Org.id,
            activityName: "Robotics with Arduino",
            batchName: "Robotics Club",
            daysOfWeek: ["SATURDAY"],
            startTime: "14:00",
            endTime: "17:00",
            ageGroupMin: 8,
            ageGroupMax: 14,
            monthlyFee: 4500,
            capacity: 10,
            enrolledCount: 8,
            gender: "ALL",
            isActive: true
          }
        ]
      }
    }
  })

  // STEP 17: Create Parents and Reviews
  console.log('Creating parent records...')
  const parentPriya = await prisma.parent.create({
    data: { name: 'Priya Raman', phone: '9884100001', email: 'priya@example.com' }
  })
  const parentSuresh = await prisma.parent.create({
    data: { name: 'Suresh Kumar', phone: '9884100002', email: 'suresh@example.com' }
  })
  const parentMeena = await prisma.parent.create({
    data: { name: 'Meena Krishnan', phone: '9884100003', email: 'meena@example.com' }
  })
  const parentAnitha = await prisma.parent.create({
    data: { name: 'Anitha Venkatesh', phone: '9884100004', email: 'anitha@example.com' }
  })
  const parentLakshmi = await prisma.parent.create({
    data: { name: 'Lakshmi Narayan', phone: '9884100005', email: 'lakshmi@example.com' }
  })

  console.log('Creating parent reviews...')
  await prisma.schoolReview.createMany({
    data: [
      {
        schoolId: school.id,
        orgId: testOrg.id,
        parentId: parentPriya.id,
        rating: 5,
        ratingAcademics: 5,
        ratingInfrastructure: 4,
        ratingFaculty: 5,
        ratingValue: 4,
        body: "Excellent school with dedicated teachers. My daughter has shown tremendous improvement in academics and confidence.",
        status: "PUBLISHED"
      },
      {
        schoolId: school.id,
        orgId: testOrg.id,
        parentId: parentSuresh.id,
        rating: 4,
        ratingAcademics: 4,
        ratingInfrastructure: 4,
        ratingFaculty: 5,
        ratingValue: 3,
        body: "Good school overall. Teachers are very caring and involved. Infrastructure could be improved but academics are top notch.",
        status: "PUBLISHED"
      },
      {
        schoolId: school.id,
        orgId: testOrg.id,
        parentId: parentMeena.id,
        rating: 5,
        ratingAcademics: 5,
        ratingInfrastructure: 5,
        ratingFaculty: 5,
        ratingValue: 5,
        body: "Best school in the area. The principal and teachers are very approachable. My son has been here for 5 years and we have no complaints whatsoever.",
        status: "PUBLISHED"
      },
      {
        schoolId: lc1.id,
        orgId: lc1Org.id,
        parentId: parentAnitha.id,
        rating: 5,
        body: "My daughter has been attending for 8 months. The transformation in her posture, discipline and confidence is remarkable. Radha ma'am is an exceptional teacher.",
        status: "PUBLISHED"
      },
      {
        schoolId: lc1.id,
        orgId: lc1Org.id,
        parentId: parentLakshmi.id,
        rating: 5,
        body: "World class instruction in Bharatanatyam. The annual arangetram performance was breathtaking. Highly recommend for any child interested in classical dance.",
        status: "PUBLISHED"
      }
    ]
  })

  // STEP 18: Log completion
  console.log('Seed complete:')
  console.log('- 13 modules created')
  console.log('- 4 plans created')
  console.log('- 11 organizations created total (1 test org + 4 schools + 6 learning centers)')
  console.log('- 1 main branch')
  console.log('- 4 CRM users created')
  console.log('- 8 admission stages')
  console.log('- 1 academic year')
  console.log('- 5 schools created total (1 Prince + 4 new)')
  console.log('- 6 learning centers created total')
  console.log('- 5 parent accounts created')
  console.log('- 5 reviews created (3 for Prince, 2 for Kalakshetra)')
  console.log('- 9 batch schedules created across learning centers')
  console.log('- 2 instructors created for Kalakshetra Dance Academy')
  console.log('- 5 sample leads')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
