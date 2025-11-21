//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const radioButtonRedirect = require('radio-button-redirect')
router.use(radioButtonRedirect)

// ============================================
// VERSIONED ROUTES CONFIGURATION
// ============================================
// Define all the version paths you want to support
const VERSIONS = [
  'ooe/v10',
  'ooe/v10_1',
  'ooe/v10_2',
   'ooe/v2',
  'coc/v1'
]

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper function to create routes for all versions
function createVersionedRoutes(routePath, handler) {
  // Create the base route
  router.get(routePath, function(req, res) {
    handler(req, res, null)
  })
  
  // Create versioned routes
  VERSIONS.forEach(version => {
    router.get(`/${version}${routePath}`, function(req, res) {
      // Store the version in session for consistency
      req.session.data = req.session.data || {}
      req.session.data.currentVersion = version
      handler(req, res, version)
    })
  })
}

// Helper function to create POST routes for all versions
function createVersionedPostRoutes(routePath, handler) {
  // Create versioned routes first
  VERSIONS.forEach(version => {
    router.post(`/${version}${routePath}`, function(req, res) {
      console.log(`Versioned POST route matched: /${version}${routePath}`)
      // Store the version in session
      req.session.data = req.session.data || {}
      req.session.data.currentVersion = version
      handler(req, res, version)
    })
  })
  
  // Then create the base route for non-versioned paths
  router.post(routePath, function(req, res) {
    console.log(`Base POST route matched: ${routePath}`)
    handler(req, res, null)
  })
}

// Helper function to render the correct template
function renderVersionedTemplate(res, templateName, version, data = {}) {
  // Check if templateName already includes the version path
  if (version && templateName.includes(version)) {
    console.log(`Template already includes version, rendering: ${templateName}`)
    return res.render(templateName, data)
  }
  
  if (version) {
    // Try versioned path
    const versionedPath = `${version}/${templateName}`
    console.log(`Attempting to render versioned template: ${versionedPath}`)
    return res.render(versionedPath, data)
  }
  
  // Fallback to root
  console.log(`Attempting to render from root: ${templateName}`)
  return res.render(templateName, data)
}

// Helper function to redirect with version
function redirectWithVersion(res, path, version) {
  // If no version, just redirect to the path
  if (!version) {
    console.log(`No version, redirecting to: ${path}`)
    return res.redirect(path)
  }
  
  // Check if the path already starts with the version
  if (path.startsWith(`/${version}`)) {
    console.log(`Path already includes version, redirecting to: ${path}`)
    return res.redirect(path)
  }
  
  // Add version to the path
  const versionedPath = `/${version}${path}`
  console.log(`Adding version to path, redirecting to: ${versionedPath}`)
  res.redirect(versionedPath)
}

// ============================================
// STATIC PAGES & MISCELLANEOUS ROUTES
// ============================================

createVersionedRoutes('/maritime-and-coastguard-agency', function (req, res, version) {
  renderVersionedTemplate(res, 'maritime-and-coastguard-agency', version)
})

createVersionedRoutes('/booking-confirmation', function (req, res, version) {
  renderVersionedTemplate(res, 'booking-confirmation', version)
})

createVersionedRoutes('/copied-page', function (req, res, version) {
  renderVersionedTemplate(res, 'copied-page', version)
})


// ---------- MARITIME AND COASTGUARD AGENCY PAGE (with session clear) ----------

// Array of paths for maritime-and-coastguard-agency
const maritimePaths = [
  '/ooe/v10-access-and-book/maritime-and-coastguard-agency',
  '/ooe/v10-manage-exam/maritime-and-coastguard-agency',
  '/ooe/v10-21days-manage-exam/maritime-and-coastguard-agency',
    '/ooe/v2-less21days-manage-exam/maritime-and-coastguard-agency'

]

// Register GET handler that clears session data
maritimePaths.forEach(path => {
  router.get(path, function(req, res) {
    // Extract the version from the path
    const version = path.split('/')[2]
    
    console.log(`=== Maritime and Coastguard Agency GET handler (${version}) - Clearing session ===`)
    
    // Clear all session data
    req.session.data = {}
    
    // Render the page
    res.render(`ooe/${version}/maritime-and-coastguard-agency`)
  })
})


// ============================================
// PRIVACY NOTICE PAGE
// ============================================

// Wildcard handler for any v10* path
router.post('/ooe/v10*/privacy-notice-check', function (req, res) {
  // Extract the actual path segment - fixed regex
  const fullPath = req.originalUrl || req.url
  const pathMatch = fullPath.match(/\/ooe\/(v10[^\/]*)/)[1]
  
  console.log(`=== Privacy notice check POST (${pathMatch}) ===`)
  console.log('Request body:', req.body)
  console.log('Privacy accepted value:', req.body['privacy-notice'])
  
  // Checkboxes often come as arrays
  let privacyAccepted = req.body['privacy-notice']
  if (Array.isArray(privacyAccepted)) {
    privacyAccepted = privacyAccepted[0]
  }
  
  // Initialize session data if needed
  req.session.data = req.session.data || {}
  
  // Check if privacy notice was accepted
  if (privacyAccepted === 'confirmed') {
    // Clear any previous errors
    delete req.session.data['privacy-error']
    delete req.session.data['privacy-error-message']
    
    // Store acceptance in session
    req.session.data['privacy-notice'] = privacyAccepted
    
    // Redirect to date of birth page
    res.redirect(`/ooe/${pathMatch}/date-of-birth`)
  } else {
    // Set error in session as STRING to match HTML template
    req.session.data['privacy-error'] = 'true'
    req.session.data['privacy-error-message'] = 'You must confirm that you have read and understood the privacy notice'
    
    // Clear the checkbox state
    delete req.session.data['privacy-notice']
    
    // Redirect back to privacy notice page with error
    res.redirect(`/ooe/${pathMatch}/privacy-notice`)
  }
})


// ============================================
// AUTHENTICATION FLOW
// ============================================

// ---------- DATE OF BIRTH PAGE ----------

// Array of paths to handle
const dateOfBirthPaths = [
  '/ooe/v10-access-and-book/date-of-birth',
  '/ooe/v10-manage-exam/date-of-birth',
  '/ooe/v10-21days-manage-exam/date-of-birth'
]

// Register the same handler for all paths
dateOfBirthPaths.forEach(path => {
  router.post(path, function (req, res) {
    // Extract the version from the path
    const version = path.split('/')[2]
    
    console.log(`=== Date of birth POST handler (${version}) ===`)
    console.log('Request body:', req.body)
    
    const day = req.body['dob-day'] ? req.body['dob-day'].trim() : ''
    const month = req.body['dob-month'] ? req.body['dob-month'].trim() : ''
    const year = req.body['dob-year'] ? req.body['dob-year'].trim() : ''
    
    console.log('Date values - Day:', day, 'Month:', month, 'Year:', year)
    
    // Initialize session data
    req.session.data = req.session.data || {}
    req.session.data['dob-day'] = day
    req.session.data['dob-month'] = month
    req.session.data['dob-year'] = year
    
    // Reset error states
    let errors = []
    let hasError = false
    req.session.data['dob-day-error'] = false
    req.session.data['dob-month-error'] = false
    req.session.data['dob-year-error'] = false
    
    // Validation logic
    if (!day && !month && !year) {
      hasError = true
      errors.push({
        text: "Enter your date of birth",
        href: "#dob-day"
      })
      req.session.data['dob-error-message'] = "Enter your date of birth"
      req.session.data['dob-day-error'] = true
      req.session.data['dob-month-error'] = true
      req.session.data['dob-year-error'] = true
    }
    else if (!day || !month || !year) {
      hasError = true
      let errorMsg = "Date of birth must include a "
      let missingFields = []
      
      if (!day) {
        missingFields.push("day")
        req.session.data['dob-day-error'] = true
      }
      if (!month) {
        missingFields.push("month")
        req.session.data['dob-month-error'] = true
      }
      if (!year) {
        missingFields.push("year")
        req.session.data['dob-year-error'] = true
      }
      
      errorMsg += missingFields.join(" and ")
      errors.push({
        text: errorMsg,
        href: "#dob-" + missingFields[0]
      })
      req.session.data['dob-error-message'] = errorMsg
    }
    else if (isNaN(day) || isNaN(month) || isNaN(year)) {
      hasError = true
      errors.push({
        text: "Date of birth must be a real date",
        href: "#dob-day"
      })
      req.session.data['dob-error-message'] = "Date of birth must be a real date"
      req.session.data['dob-day-error'] = true
      req.session.data['dob-month-error'] = true
      req.session.data['dob-year-error'] = true
    }
    else if (parseInt(day) < 1 || parseInt(day) > 31 || 
             parseInt(month) < 1 || parseInt(month) > 12 || 
             parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear()) {
      hasError = true
      errors.push({
        text: "Date of birth must be a real date",
        href: "#dob-day"
      })
      req.session.data['dob-error-message'] = "Date of birth must be a real date"
      
      if (parseInt(day) < 1 || parseInt(day) > 31) {
        req.session.data['dob-day-error'] = true
      }
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        req.session.data['dob-month-error'] = true
      }
      if (parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear()) {
        req.session.data['dob-year-error'] = true
      }
    }
    
    // Additional date validation for invalid dates like February 31st
    if (!hasError) {
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      if (dateObj.getDate() != parseInt(day) || 
          dateObj.getMonth() != parseInt(month) - 1 || 
          dateObj.getFullYear() != parseInt(year)) {
        hasError = true
        errors.push({
          text: "Date of birth must be a real date",
          href: "#dob-day"
        })
        req.session.data['dob-error-message'] = "Date of birth must be a real date"
        req.session.data['dob-day-error'] = true
        req.session.data['dob-month-error'] = true
        req.session.data['dob-year-error'] = true
      }
    }
    
    // Handle the result
    if (hasError) {
      console.log('Validation failed:', errors)
      req.session.data['dob-error'] = 'true'
      req.session.data['dob-error-list'] = errors
      res.redirect(`/ooe/${version}/date-of-birth`)
    } else {
      console.log('Validation passed, redirecting to sds-number')
      req.session.data['dob-error'] = 'false'
      req.session.data['dob-error-message'] = ''
      req.session.data['dob-error-list'] = []
      req.session.data['dob-day-error'] = false
      req.session.data['dob-month-error'] = false
      req.session.data['dob-year-error'] = false
      res.redirect(`/ooe/${version}/sds-number`)
    }
  })
})

// ---------- SDS NUMBER PAGE ----------

// Array of paths to handle
const sdsNumberPaths = [
  '/ooe/v10-access-and-book/sds-number',
  '/ooe/v10-manage-exam/sds-number',
  '/ooe/v10-21days-manage-exam/sds-number'
]

// Register the same handler for all paths
sdsNumberPaths.forEach(path => {
  router.post(path, function (req, res) {
    // Extract the version from the path
    const version = path.split('/')[2]
    
    console.log(`=== SDS number POST handler (${version}) ===`)
    console.log('Request body:', req.body)
    
    let sdsNumber = req.body['sdsNumber'] ? req.body['sdsNumber'].trim() : ''
    
    console.log('SDS Number entered:', sdsNumber)
    
    // Initialize session data
    req.session.data = req.session.data || {}
    req.session.data['sdsNumber'] = sdsNumber
    
    // Reset error state
    let hasError = false
    let errorMessage = ''
    let errors = []
    
    // Validation logic
    if (!sdsNumber) {
      hasError = true
      errorMessage = 'Enter your SDS number'
      errors.push({
        text: errorMessage,
        href: "#sdsNumber"
      })
    }
    else if (!/^\d+$/.test(sdsNumber)) {
      hasError = true
      errorMessage = 'SDS number must only include numbers'
      errors.push({
        text: errorMessage,
        href: "#sdsNumber"
      })
    }
    else if (!sdsNumber.startsWith('0')) {
      hasError = true
      errorMessage = 'SDS number must start with a 0'
      errors.push({
        text: errorMessage,
        href: "#sdsNumber"
      })
    }
    else if (sdsNumber.length !== 10) {
      hasError = true
      if (sdsNumber.length < 10) {
        errorMessage = 'SDS number is too short - it must be 10 digits'
      } else {
        errorMessage = 'SDS number is too long - it must be 10 digits'
      }
      errors.push({
        text: errorMessage,
        href: "#sdsNumber"
      })
    }
    else if (sdsNumber === '0000000000') {
      hasError = true
      errorMessage = 'Enter a valid SDS number'
      errors.push({
        text: errorMessage,
        href: "#sdsNumber"
      })
    }

    // Handle the result
    if (hasError) {
      console.log('Validation failed:', errorMessage)
      req.session.data['sds-error'] = 'true'
      req.session.data['sds-error-message'] = errorMessage
      req.session.data['sds-error-list'] = errors
      res.redirect(`/ooe/${version}/sds-number`)
    } else {
      console.log('Validation passed')
      req.session.data['sds-error'] = 'false'
      req.session.data['sds-error-message'] = ''
      req.session.data['sds-error-list'] = []
      
      // Conditional routing based on SDS number
      const sdsNumberInt = parseInt(sdsNumber, 10)
      console.log('SDS number as integer:', sdsNumberInt)
      
      if (sdsNumberInt >= 1 && sdsNumberInt <= 9) {
        console.log('SDS number in no-record range, redirecting to no-record-found')
        res.redirect(`/ooe/${version}/no-record-found`)
      } else {
        console.log('SDS number valid, redirecting to confirm-seafarer-record')
        res.redirect(`/ooe/${version}/confirm-seafarer-record`)
      }
    }
  })
})

// ---------- NO RECORD FOUND PAGE ----------

// No POST handler needed for no-record-found, it's just a display page

// ============================================
// RECORD CONFIRMATION FLOW
// ============================================

// ---------- CONFIRM SEAFARER RECORD PAGE ----------

// Array of paths to handle
const confirmSeafarerPaths = [
  '/ooe/v10-access-and-book/confirm-seafarer-record',
  '/ooe/v10-manage-exam/confirm-seafarer-record',
  '/ooe/v10-21days-manage-exam/confirm-seafarer-record'
]

// Register the same handler for all paths
confirmSeafarerPaths.forEach(path => {
  router.post(path, function (req, res) {
    // Extract the version from the path
    const version = path.split('/')[2]
    
    console.log(`=== Confirm seafarer record POST handler (${version}) ===`)
    console.log('Request body:', req.body)
    
    let confirmRecord = req.body['confirmRecord']
    
    if (Array.isArray(confirmRecord)) {
      confirmRecord = confirmRecord[0]
    }
    
    console.log('Confirm record value:', confirmRecord)
    
    req.session.data = req.session.data || {}
    req.session.data['confirmRecord'] = confirmRecord
    
    let hasError = false
    let errorMessage = ''
    let errors = []
    
    if (!confirmRecord) {
      hasError = true
      errorMessage = 'Select yes if this is the correct record'
      errors.push({
        text: errorMessage,
        href: "#confirmRecord"
      })
    }
    
    if (hasError) {
      console.log('Validation failed: No option selected')
      req.session.data['confirm-error'] = 'true'
      req.session.data['confirm-error-message'] = errorMessage
      req.session.data['confirm-error-list'] = errors
      res.redirect(`/ooe/${version}/confirm-seafarer-record`)
    } else {
      console.log('Validation passed, option selected:', confirmRecord)
      req.session.data['confirm-error'] = 'false'
      req.session.data['confirm-error-message'] = ''
      req.session.data['confirm-error-list'] = []
      
      if (confirmRecord === 'yes') {
        console.log('User confirmed record, redirecting to contact-email')
        res.redirect(`/ooe/${version}/contact-email`)
      } else if (confirmRecord === 'no') {
        console.log('User rejected record, redirecting to help-finding-your-record')
        res.redirect(`/ooe/${version}/help-finding-your-record`)
      }
    }
  })
})

// ---------- HELP FINDING YOUR RECORD PAGE ----------

// No POST handler needed for help-finding-your-record, it's just a display page

// ============================================
// EMAIL VERIFICATION FLOW
// ============================================

// ---------- CONTACT EMAIL PAGE ----------

// Array of paths to handle for contact-email-check
const contactEmailPaths = [
  '/ooe/v10-access-and-book/contact-email-check',
  '/ooe/v10-manage-exam/contact-email-check',
  '/ooe/v10-21days-manage-exam/contact-email-check'
]

// Register the same handler for all paths
contactEmailPaths.forEach(path => {
  router.post(path, function (req, res) {
    // Extract the version from the path
    const version = path.split('/')[2]
    
    console.log(`=== Contact email check POST handler (${version}) ===`)
    console.log('Request body:', req.body)
    
    let correctEmail = req.body['correctEmail']
    
    if (Array.isArray(correctEmail)) {
      correctEmail = correctEmail[0]
    }
    
    console.log('Correct email value:', correctEmail)
    
    req.session.data = req.session.data || {}
    req.session.data['correctEmail'] = correctEmail
    
    let hasError = false
    let errorMessage = ''
    let errors = []
    
    if (!correctEmail) {
      hasError = true
      errorMessage = 'Select yes if this email address is correct'
      errors.push({
        text: errorMessage,
        href: "#correctEmail"
      })
    }
    
    if (hasError) {
      console.log('Validation failed: No option selected')
      req.session.data['contact-email-error'] = 'true'
      req.session.data['contact-email-error-message'] = errorMessage
      req.session.data['contact-email-error-list'] = errors
      res.redirect(`/ooe/${version}/contact-email`)
    } else {
      console.log('Validation passed, option selected:', correctEmail)
      req.session.data['contact-email-error'] = 'false'
      req.session.data['contact-email-error-message'] = ''
      req.session.data['contact-email-error-list'] = []
      
      if (correctEmail === 'yes') {
        console.log('Email confirmed as correct, redirecting to dashboard')
        res.redirect(`/ooe/${version}/dashboard`)
      } else if (correctEmail === 'no') {
        console.log('Email needs updating, redirecting to how-to-update-contact-information')
        res.redirect(`/ooe/${version}/how-to-update-contact-information`)
      }
    }
  })
})

// ---------- HOW TO UPDATE CONTACT INFORMATION PAGE ----------

// No POST handler needed for how-to-update-contact-information, it's just a display page

// ---------- UPDATE EMAIL PAGE ----------

// Array of paths to handle for update-email
const updateEmailPaths = [
  '/ooe/v10-access-and-book/update-email',
  '/ooe/v10-manage-exam/update-email',
  '/ooe/v10-21days-manage-exam/update-email'
]

// Register the same handler for all paths
updateEmailPaths.forEach(path => {
  router.post(path, function (req, res) {
    // Extract the version from the path
    const version = path.split('/')[2]
    
    console.log(`=== Update email POST handler (${version}) ===`)
    console.log('Request body:', req.body)
    
    const email = req.body['email'] ? req.body['email'].trim() : ''
    const emailConfirm = req.body['emailConfirm'] ? req.body['emailConfirm'].trim() : ''
    
    req.session.data = req.session.data || {}
    req.session.data['email'] = email
    req.session.data['emailConfirm'] = emailConfirm
    
    let errors = []
    let hasError = false
    req.session.data['email-field-error'] = false
    req.session.data['email-confirm-error'] = false
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    // Validation logic
    if (!email && !emailConfirm) {
      hasError = true
      errors.push({
        text: "Enter your email address",
        href: "#email"
      })
      req.session.data['email-field-error'] = "Enter your email address"
      errors.push({
        text: "Confirm your email address",
        href: "#email-confirm"
      })
      req.session.data['email-confirm-error'] = "Confirm your email address"
    } else if (!email) {
      hasError = true
      errors.push({
        text: "Enter your email address",
        href: "#email"
      })
      req.session.data['email-field-error'] = "Enter your email address"
    } else if (!emailConfirm) {
      hasError = true
      errors.push({
        text: "Confirm your email address",
        href: "#email-confirm"
      })
      req.session.data['email-confirm-error'] = "Confirm your email address"
    } else if (!emailRegex.test(email)) {
      hasError = true
      errors.push({
        text: "Enter a valid email address",
        href: "#email"
      })
      req.session.data['email-field-error'] = "Enter a valid email address"
    } else if (!emailRegex.test(emailConfirm)) {
      hasError = true
      errors.push({
        text: "Enter a valid email address",
        href: "#email-confirm"
      })
      req.session.data['email-confirm-error'] = "Enter a valid email address"
    } else if (email !== emailConfirm) {
      hasError = true
      errors.push({
        text: "Email addresses do not match",
        href: "#email-confirm"
      })
      req.session.data['email-confirm-error'] = "Email addresses do not match"
    }
    
    if (hasError) {
      req.session.data['email-error'] = 'true'
      req.session.data['email-error-list'] = errors
      res.redirect(`/ooe/${version}/update-email`)
    } else {
      req.session.data['email-error'] = 'false'
      req.session.data['email-field-error'] = false
      req.session.data['email-confirm-error'] = false
      req.session.data['email-error-list'] = []
      req.session.data['updatedEmail'] = email
      res.redirect(`/ooe/${version}/oral-examinations-dashboard`)
    }
  })
})

// ============================================
// DASHBOARD PAGES
// ============================================

router.get('/ooe/v10-access-and-book/dashboard', function (req, res) {
  console.log('=== Dashboard GET handler ===')
  req.session.data = req.session.data || {}
  req.session.data['contact-email-error'] = 'false'
  res.render('ooe/v10-access-and-book/dashboard')
})

createVersionedRoutes('/dashboard', function (req, res, version) {
  req.session.data['contact-email-error'] = 'false'
  renderVersionedTemplate(res, 'dashboard', version)
})

createVersionedRoutes('/oral-examinations-dashboard', function (req, res, version) {
  renderVersionedTemplate(res, 'oral-examinations-dashboard', version)
})

// ============================================
// APPOINTMENT BOOKING FLOW
// ============================================

// ---------- FIND TEST CENTRE PAGE ----------

router.get('/ooe/v10-access-and-book/find-test-centre', function (req, res) {
  console.log('=== Find test centre GET handler ===')
  req.session.data = req.session.data || {}
  req.session.data['slot-error'] = 'false'
  req.session.data['appointmentSlot'] = ''
  res.render('/ooe/v10-access-and-book/find-test-centre')
})

router.post('/ooe/v10-access-and-book/find-test-centre', function (req, res) {
  console.log('=== Find test centre POST handler ===')
  console.log('Request body:', req.body)
  
  const testCentre = req.body['testCentre']
  
  req.session.data = req.session.data || {}
  req.session.data['testCentre'] = testCentre
  
  res.redirect('/ooe/v10-access-and-book/select-date')
})

createVersionedRoutes('/find-test-centre', function (req, res, version) {
  req.session.data['slot-error'] = 'false'
  req.session.data['appointmentSlot'] = ''
  renderVersionedTemplate(res, 'find-test-centre', version)
})

// ---------- SELECT DATE PAGE ----------

router.get('/ooe/v10-access-and-book/select-date', function (req, res) {
  console.log('=== Select date GET handler ===')
  req.session.data = req.session.data || {}
  req.session.data['slot-error'] = 'false'
  req.session.data['appointmentSlot'] = ''
  res.render('ooe/v10-access-and-book/select-date')
})

router.post('/ooe/v10-access-and-book/select-date', function (req, res) {
  console.log('=== Select date POST handler ===')
  console.log('Request body:', req.body)
  
  const selectedDate = req.body['selectedDate']
  
  req.session.data = req.session.data || {}
  req.session.data['selectedDate'] = selectedDate
  
  res.redirect('/ooe/v10-access-and-book/choose-a-slot')
})

createVersionedRoutes('/select-date', function (req, res, version) {
  req.session.data['slot-error'] = 'false'
  req.session.data['appointmentSlot'] = ''
  renderVersionedTemplate(res, 'select-date', version)
})

/// ---------- ENTER A DATE FOR A SLOT PAGE ----------

router.get('/ooe/v10-access-and-book/enter-a-date-for-a-slot', function (req, res) {
  console.log('=== Enter a date for a slot GET handler ===')
  
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  
  req.session.data = req.session.data || {}
  req.session.data['todayDate'] = todayString
  req.session.data['todayYear'] = today.getFullYear()
  req.session.data['todayMonth'] = today.getMonth() + 1
  req.session.data['todayDay'] = today.getDate()
  
  // CLEAR ERROR STATE ON INITIAL PAGE LOAD
  // Only keep errors if we're coming from a redirect after POST
  if (!req.headers.referer || !req.headers.referer.includes('enter-a-date-for-a-slot')) {
    req.session.data['date-error'] = 'false'
    req.session.data['date-error-message'] = ''
    req.session.data['date-error-list'] = []
  }
  
  console.log('Today\'s date for validation:', todayString)
  console.log('Error state:', req.session.data['date-error'])
  
  res.render('ooe/v10-access-and-book/enter-a-date-for-a-slot')
})

router.post('/ooe/v10-access-and-book/enter-a-date-for-a-slot', function (req, res) {
  console.log('=== Enter a date for a slot POST handler ===')
  console.log('Request body:', req.body)
  
  const day = req.body['date-day'] ? req.body['date-day'].trim() : ''
  const month = req.body['date-month'] ? req.body['date-month'].trim() : ''
  const year = req.body['date-year'] ? req.body['date-year'].trim() : ''
  
  req.session.data = req.session.data || {}
  req.session.data['date-day'] = day
  req.session.data['date-month'] = month
  req.session.data['date-year'] = year
  
  let hasError = false
  let errorMessage = ''
  let errors = []
  
  // Validation
  if (!day || !month || !year) {
    hasError = true
    errorMessage = 'Enter a complete date'
    errors.push({
      text: errorMessage,
      href: "#date-day"
    })
  } else {
    const selectedDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate.getDate() != day || selectedDate.getMonth() != month - 1 || selectedDate.getFullYear() != year) {
      hasError = true
      errorMessage = 'Enter a valid date'
      errors.push({
        text: errorMessage,
        href: "#date-day"
      })
    }
    else if (selectedDate < today) {
      hasError = true
      errorMessage = 'Date must not be in the past'
      errors.push({
        text: errorMessage,
        href: "#date-day"
      })
    }
    else if (selectedDate > new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000))) {
      hasError = true
      errorMessage = 'Date must be within the next 3 months'
      errors.push({
        text: errorMessage,
        href: "#date-day"
      })
    }
  }
  
  if (hasError) {
    req.session.data['date-error'] = 'true'
    req.session.data['date-error-message'] = errorMessage
    req.session.data['date-error-list'] = errors
    res.redirect('/ooe/v10-access-and-book/enter-a-date-for-a-slot')
  } else {
    // CLEAR ALL ERROR STATES ON SUCCESS
    req.session.data['date-error'] = 'false'
    req.session.data['date-error-message'] = ''
    req.session.data['date-error-list'] = []
    req.session.data['date-day-error'] = false
    req.session.data['date-month-error'] = false
    req.session.data['date-year-error'] = false
    
    const selectedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    req.session.data['selectedDate'] = selectedDate
    req.session.data['chosenAppointmentDate'] = selectedDate
    
    console.log('Date selected:', selectedDate)
    
    res.redirect('/ooe/v10-access-and-book/choose-a-slot')
  }
})

createVersionedRoutes('/enter-a-date-for-a-slot', function (req, res, version) {
  // Clear error state for versioned routes too
  req.session.data = req.session.data || {}
  if (!req.headers.referer || !req.headers.referer.includes('enter-a-date-for-a-slot')) {
    req.session.data['date-error'] = 'false'
    req.session.data['date-error-message'] = ''
    req.session.data['date-error-list'] = []
  }
  renderVersionedTemplate(res, 'enter-a-date-for-a-slot', version, { data: req.query })
})

createVersionedPostRoutes('/choose-a-slot/', function (req, res, version) {
  redirectWithVersion(res, '/choose-a-slot', version)
})

// ---------- CHOOSE A SLOT PAGE ----------

// Array of paths to handle for check-your-answers POST from choose-a-slot
const checkYourAnswersPaths = [
  '/ooe/v10-access-and-book/check-your-answers',
  '/ooe/v10-manage-exam/check-your-answers',
  '/ooe/v10-21days-manage-exam/check-your-answers'
]

// POST handler for when a time slot button is clicked
// This handles the form submission from the time slot buttons
checkYourAnswersPaths.forEach(path => {
  router.post(path, function (req, res) {
    const version = path.split('/')[2]
    
    console.log(`=== Check your answers POST handler (from time slot buttons) (${version}) ===`)
    console.log('Request body:', req.body)
    
    // Get the slot ID and time from the form submission
    const slotId = req.body['slotId']
    const appointmentTime = req.body['appointmentTime']
    
    // Initialize session data
    req.session.data = req.session.data || {}
    
    // Store the raw slot information
    req.session.data['slotId'] = slotId
    req.session.data['appointmentTime'] = appointmentTime
    req.session.data['appointmentTime24'] = appointmentTime
    
    // Format the time for display (e.g., "08:00" becomes "8:00am")
    if (appointmentTime) {
      const [hours, minutes] = appointmentTime.split(':')
      const hour = parseInt(hours)
      const period = hour >= 12 ? 'pm' : 'am'
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
      
      req.session.data['appointmentTimeFormatted'] = `${displayHour}:${minutes}${period}`
      req.session.data['appointmentHour'] = hours
      req.session.data['appointmentMinute'] = minutes
    }
    
    // Parse and format the date from slotId (format: "2025-10-13T08:00:00.000Z")
    if (slotId) {
      const slotDate = new Date(slotId)
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December']
      
      // Store formatted date (e.g., "13 October 2025")
      req.session.data['appointmentDateFormatted'] = `${slotDate.getDate()} ${monthNames[slotDate.getMonth()]} ${slotDate.getFullYear()}`
      
      // Store the date in ISO format
      req.session.data['selectedDate'] = slotId.split('T')[0]
      
      // Store individual date components if needed
      req.session.data['appointmentDay'] = slotDate.getDate()
      req.session.data['appointmentMonth'] = slotDate.getMonth() + 1
      req.session.data['appointmentYear'] = slotDate.getFullYear()
    }
    
    console.log('Appointment booked for:', appointmentTime, 'on', req.session.data['appointmentDateFormatted'])
    console.log('Session data stored:', {
      time: req.session.data['appointmentTimeFormatted'],
      date: req.session.data['appointmentDateFormatted'],
      slotId: slotId
    })
    
    // Render the check-your-answers page directly (don't redirect to avoid GET request)
    res.render(`ooe/${version}/check-your-answers`)
  })
})

// ---------- CONFIRM APPOINTMENT PAGE ----------

// No POST handler needed for confirm-appointment, it's just a display page

// ============================================
// RESCHEDULE APPOINTMENT FLOW
// ============================================

// No POST handler needed for reschedule-enter-a-date-for-a-slot to reschedule-choose-a-slot
// Keep the existing createVersionedPostRoutes as is

// Array of paths to handle for reschedule-check-your-answers POST from reschedule-choose-a-slot
const rescheduleCheckYourAnswersPaths = [
  '/ooe/v10-access-and-book/reschedule-check-your-answers',
  '/ooe/v10-manage-exam/reschedule-check-your-answers',
  '/ooe/v10-21days-manage-exam/reschedule-check-your-answers',
'/ooe/v2-less21days-manage-exam/reschedule-check-your-answers'

]

// POST handler for when a time slot button is clicked in reschedule flow
rescheduleCheckYourAnswersPaths.forEach(path => {
  router.post(path, function (req, res) {
    const version = path.split('/')[2]
    
    console.log(`=== Reschedule check your answers POST handler (${version}) ===`)
    console.log('Request body:', req.body)
    
    // Get the slot ID and time from the form submission
    const slotId = req.body['slotId']
    const appointmentTime = req.body['appointmentTime']
    
    // Initialize session data
    req.session.data = req.session.data || {}
    
    // Store the raw slot information
    req.session.data['rescheduleSlotId'] = slotId
    req.session.data['rescheduleAppointmentTime'] = appointmentTime
    req.session.data['rescheduleAppointmentTime24'] = appointmentTime
    
    // Format the time for display (e.g., "08:00" becomes "8:00am")
    if (appointmentTime) {
      const [hours, minutes] = appointmentTime.split(':')
      const hour = parseInt(hours)
      const period = hour >= 12 ? 'pm' : 'am'
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
      
      req.session.data['rescheduleAppointmentTimeFormatted'] = `${displayHour}:${minutes}${period}`
      req.session.data['rescheduleAppointmentHour'] = hours
      req.session.data['rescheduleAppointmentMinute'] = minutes
    }
    
    // Parse and format the date from slotId
    if (slotId) {
      const slotDate = new Date(slotId)
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December']
      
      req.session.data['rescheduleAppointmentDateFormatted'] = `${slotDate.getDate()} ${monthNames[slotDate.getMonth()]} ${slotDate.getFullYear()}`
      req.session.data['rescheduleSelectedDate'] = slotId.split('T')[0]
      req.session.data['rescheduleAppointmentDay'] = slotDate.getDate()
      req.session.data['rescheduleAppointmentMonth'] = slotDate.getMonth() + 1
      req.session.data['rescheduleAppointmentYear'] = slotDate.getFullYear()
    }
    
    console.log('Reschedule appointment data stored, rendering reschedule-check-your-answers')
    
    // Render the reschedule-check-your-answers page directly
    res.render(`ooe/${version}/reschedule-check-your-answers`)
  })
})

// Keep existing versioned routes
createVersionedRoutes('/reschedule-enter-a-date-for-a-slot', function (req, res, version) {
  renderVersionedTemplate(res, 'reschedule-enter-a-date-for-a-slot', version, { data: req.query })
})

createVersionedPostRoutes('/reschedule-choose-a-slot/', function (req, res, version) {
  redirectWithVersion(res, '/reschedule-choose-a-slot', version)
})

createVersionedRoutes('/reschedule-choose-a-slot', function (req, res, version) {
  renderVersionedTemplate(res, 'reschedule-choose-a-slot', version)
})

// ============================================
// CANCEL EXAM BOOKING FLOW
// ============================================

// ---------- STANDARD CANCELLATION ----------

// ---------- CANCEL EXAM BOOKING (REGULAR) ----------

// Array of paths for cancel-exam-booking POST
const cancelExamPaths = [
  '/ooe/v10-access-and-book/cancel-exam-booking',
  '/ooe/v10-manage-exam/cancel-exam-booking',
  '/ooe/v10-21days-manage-exam/cancel-exam-booking',
  '/ooe/v2-less21days-manage-exam/cancel-exam-booking'
]

// Array of paths for cancellation-check-your-answers GET
const cancellationCheckPaths = [
  '/ooe/v10-access-and-book/cancellation-check-your-answers',
  '/ooe/v10-manage-exam/cancellation-check-your-answers',
  '/ooe/v10-21days-manage-exam/cancellation-check-your-answers',
    '/ooe/v2-less21days-manage-exam/cancellation-check-your-answers'

]

// Register GET handlers for cancellation-check-your-answers
cancellationCheckPaths.forEach(path => {
  router.get(path, function(req, res) {
    const version = path.split('/')[2]
    delete req.session.data['confirm-error']
    delete req.session.data['other-reason-error']
    res.render(`ooe/${version}/cancellation-check-your-answers`)
  })
})

// Register POST handlers for cancel-exam-booking
cancelExamPaths.forEach(path => {
  router.post(path, function(req, res) {
    const version = path.split('/')[2]
    
    console.log(`=== Cancel exam booking POST handler (${version}) ===`)
    console.log('Request body:', req.body)
    
    const confirmRecord = req.body.confirmRecord
    const otherReason = req.body.otherReason
    
    req.session.data = req.session.data || {}
    
    delete req.session.data['confirm-error']
    delete req.session.data['other-reason-error']
    
    let hasError = false
    
    if (!confirmRecord) {
      req.session.data['confirm-error'] = 'true'
      hasError = true
    }
    
    if (confirmRecord === 'other' && (!otherReason || otherReason.trim() === '')) {
      req.session.data['other-reason-error'] = 'true'
      hasError = true
    }
    
    if (hasError) {
      req.session.data.confirmRecord = confirmRecord
      req.session.data.otherReason = otherReason
      return res.redirect(`/ooe/${version}/cancel-exam-booking`)
    }
    
    req.session.data.confirmRecord = confirmRecord
    req.session.data.otherReason = otherReason
    
    if (confirmRecord === 'other') {
      req.session.data.cancellationReason = otherReason
    } else {
      req.session.data.cancellationReason = confirmRecord
    }
    
    req.session.data.examType = 'Marine Engine Operator Licence (MEOL) and Senior MEOL'
    req.session.data.examDateTime = '12:30 (BST), 24 October 2025'
    
    res.redirect(`/ooe/${version}/cancellation-check-your-answers`)
  })
})

// ---------- 21 DAYS CANCELLATION ----------

// Array of paths to handle for cancel-exam-booking-21days POST
const cancelExam21DaysPaths = [
  '/ooe/v10-access-and-book/cancel-exam-booking-21days',
  '/ooe/v10-manage-exam/cancel-exam-booking-21days',
  '/ooe/v10-21days-manage-exam/cancel-exam-booking-21days',
    '/ooe/v2-less21days-manage-exam/cancel-exam-booking-21days'

]

// Array of paths for cancellation-check-your-answers-21days GET
const cancellationCheck21DaysPaths = [
  '/ooe/v10-access-and-book/cancellation-check-your-answers-21days',
  '/ooe/v10-manage-exam/cancellation-check-your-answers-21days',
  '/ooe/v10-21days-manage-exam/cancellation-check-your-answers-21days',
      '/ooe/v2-less21days-manage-exam/cancellation-check-your-answers-21days'

]

// Register GET handlers for cancellation-check-your-answers-21days
cancellationCheck21DaysPaths.forEach(path => {
  router.get(path, function(req, res) {
    const version = path.split('/')[2]
    delete req.session.data['confirm-error']
    delete req.session.data['other-reason-error']
    res.render(`ooe/${version}/cancellation-check-your-answers-21days`)
  })
})

// Register POST handlers for cancel-exam-booking-21days
cancelExam21DaysPaths.forEach(path => {
  router.post(path, function(req, res) {
    // Extract the version from the path
    const version = path.split('/')[2]
    
    console.log(`=== Cancel exam booking 21 days POST handler (${version}) ===`)
    console.log('Request body:', req.body)
    
    const confirmRecord = req.body.confirmRecord
    const otherReason = req.body.otherReason
    
    // Initialize session data
    req.session.data = req.session.data || {}
    
    delete req.session.data['confirm-error']
    delete req.session.data['other-reason-error']
    
    let hasError = false
    
    if (!confirmRecord) {
      req.session.data['confirm-error'] = 'true'
      hasError = true
    }
    
    if (confirmRecord === 'other' && (!otherReason || otherReason.trim() === '')) {
      req.session.data['other-reason-error'] = 'true'
      hasError = true
    }
    
    if (hasError) {
      req.session.data.confirmRecord = confirmRecord
      req.session.data.otherReason = otherReason
      return res.redirect(`/ooe/${version}/cancel-exam-booking-21days`)
    }
    
    req.session.data.confirmRecord = confirmRecord
    req.session.data.otherReason = otherReason
    
    if (confirmRecord === 'other') {
      req.session.data.cancellationReason = otherReason
    } else {
      req.session.data.cancellationReason = confirmRecord
    }
    
    req.session.data.examType = 'Marine Engine Operator Licence (MEOL) and Senior MEOL'
    req.session.data.examDateTime = '13:30 (BST), 16 September 2025'
    
    // Now redirect works because we have GET handlers
    res.redirect(`/ooe/${version}/cancellation-check-your-answers-21days`)
  })
})

// Keep existing GET routes as they are
createVersionedRoutes('/cancel-exam-booking-21days', function(req, res, version) {
  delete req.session.data['confirm-error']
  delete req.session.data['other-reason-error']
  renderVersionedTemplate(res, 'cancel-exam-booking-21days', version)
})

createVersionedRoutes('/cancellation-check-your-answers-21days', function(req, res, version) {
  delete req.session.data['confirm-error']
  delete req.session.data['other-reason-error']
  renderVersionedTemplate(res, 'cancellation-check-your-answers-21days', version)
})

// ============================================
// MISCELLANEOUS ROUTE HANDLERS
// ============================================

// Run this code when a form is submitted to 'right-record-answer'
createVersionedPostRoutes('/right-record-answer', function (req, res, version) {
  var rightRecord = req.session.data['right-record']

  if (rightRecord == "true"){
    redirectWithVersion(res, '/online-oral-examinations', version)
  } else if (rightRecord == "false") {
    redirectWithVersion(res, '/help-finding-your-record', version)
  }
})

// ============================================
// CATCH-ALL ROUTE FOR ANY UNMATCHED PATHS
// ============================================
// This should be at the very end of your routes
// IMPORTANT: This must be AFTER all other routes
router.get('*', function(req, res, next) {
  // Get the path without the leading slash
  const path = req.path.substring(1)
  
  // Skip if path is empty or is an asset
  if (!path || path.includes('.')) {
    return next()
  }
  
  console.log('Catch-all GET route triggered for path:', path)
  
  // Don't handle POST endpoints that are accessed via GET
  if (path.includes('-check') || path.includes('-answer') || path.includes('-submit')) {
    console.log('This looks like a POST endpoint accessed via GET, returning 404')
    return res.status(404).send('This endpoint only accepts POST requests')
  }
  
  // For any other path, just try to render it directly
  // The GOV.UK Prototype Kit will look in the views folder
  res.render(path)
})

module.exports = router


// Helper function to get OOW type label
function getOowTypeLabel(code) {
  switch (code) {
    case 'II3_D': return 'II/3 OOW — Less than 500GT, Category "D" Waters'
    case 'II3_NC': return 'II/3 OOW — Less than 500GT, Near Coastal Waters'
    case 'II1_UL': return 'II/1 OOW — Unlimited Tonnage, Unlimited Area'
    default: return 'Not selected'
  }
}

// Helper function to get certificate label for application-oow journey
function getCertificateLabel(code) {
  switch (code) {
    case 'II1-UL': return 'II/1 OOW, Unlimited Tonnage, Unlimited Area'
    case 'II3-D': return 'II/3 – OOW (Less than 500GT, Category "D" Waters)'
    case 'II3-NC': return 'II/3 – OOW (Less than 500GT, Near Coastal Waters)'
    default: return 'Not selected'
  }
}

// Helper function to get certificate subtitle for task list
function getCertificateSubtitle(code) {
  switch (code) {
    case 'II1-UL': return 'Unlimited Tonnage, Unlimited Area'
    case 'II3-D': return 'Less than 500GT, Category "D" Waters'
    case 'II3-NC': return 'Less than 500GT, Near Coastal Waters'
    default: return ''
  }
}

// Add your routes here
