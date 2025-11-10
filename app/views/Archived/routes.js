//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here
router.get('/copied-page', function (req, res) {
  res.render('copied-page')
})
// Run this code when a form is submitted to 'juggling-balls-answer'
router.post('/right-record-answer', function (req, res) {

  // Make a variable and give it the value from 'how-many-balls'
  var rightRecord = req.session.data['right-record']

  // Check whether the variable matches a condition
  if (rightRecord == "true"){
    // Send user to next page
    res.redirect('/online-oral-examinations')
  } else if (rightRecord == "false") {
    // Send user to ineligible page
    res.redirect('/help-finding-your-record')
  }

})

// Privacy notice routes

// Display the privacy notice page
router.get('/privacy-notice', function (req, res) {
  // Clear any errors when viewing the page via GET request
  req.session.data['privacy-error'] = 'false'
  
  // The checkbox state is preserved in req.session.data['privacy-notice']
  // so it will automatically be checked if user returns via back button
  
  res.render('privacy-notice')
})

// Handle form submission
router.post('/privacy-notice-check', function (req, res) {
  // Get checkbox value from form submission
  let privacyConfirmed = req.body['privacy-notice']
  
  // Handle array values from checkbox
  if (Array.isArray(privacyConfirmed)) {
    // Check if 'confirmed' is in the array
    privacyConfirmed = privacyConfirmed.includes('confirmed') ? 'confirmed' : undefined
  }
  
  // ALWAYS store the checkbox state (whether checked or not)
  if (privacyConfirmed === 'confirmed') {
    req.session.data['privacy-notice'] = 'confirmed'
  } else {
    // Important: Clear the saved state if unchecked
    delete req.session.data['privacy-notice']
  }
  
  // Check if checkbox was ticked
  if (privacyConfirmed === 'confirmed') {
    // Checkbox is checked - clear error and go to next page
    req.session.data['privacy-error'] = 'false'
    res.redirect('/date-of-birth')
  } else {
    // Checkbox not checked - set error and return to same page
    req.session.data['privacy-error'] = 'true'
    res.redirect('/privacy-notice')
  }
})

// Example route for date-of-birth page (add this if you don't have it)
router.get('/date-of-birth', function (req, res) {
  // Clear any errors from previous pages
  req.session.data['privacy-error'] = 'false'
  
  res.render('date-of-birth')
})

// If you have a POST route for date-of-birth, ensure it saves the data
router.post('/date-of-birth-check', function (req, res) {
  // Save the date of birth data
  req.session.data['date-of-birth-day'] = req.body['date-of-birth-day']
  req.session.data['date-of-birth-month'] = req.body['date-of-birth-month']
  req.session.data['date-of-birth-year'] = req.body['date-of-birth-year']
  
  // Continue to next page
  res.redirect('/sds-number')
})



// Date of birth routes with all validation states

// Display the date of birth page
router.get('/date-of-birth', function (req, res) {
  // Don't clear errors - let them persist from POST
  res.render('date-of-birth')
})

// Handle date of birth form submission
router.post('/date-of-birth', function (req, res) {
  // Get the date values and trim whitespace
  const day = req.body['dob-day'] ? req.body['dob-day'].trim() : ''
  const month = req.body['dob-month'] ? req.body['dob-month'].trim() : ''
  const year = req.body['dob-year'] ? req.body['dob-year'].trim() : ''
  
  // Always save the form values
  req.session.data['dob-day'] = day
  req.session.data['dob-month'] = month
  req.session.data['dob-year'] = year
  
  // Reset error states
  let errors = []
  let hasError = false
  req.session.data['dob-day-error'] = false
  req.session.data['dob-month-error'] = false
  req.session.data['dob-year-error'] = false
  
  // VALIDATION LOGIC
  
  // 1. Check if all fields are empty
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
  // 2. Check for missing fields combinations
  else if (!day || !month || !year) {
    hasError = true
    
    // Missing day and month
    if (!day && !month && year) {
      errors.push({
        text: "Enter a day and month",
        href: "#dob-day"
      })
      req.session.data['dob-error-message'] = "Enter a day and month"
      req.session.data['dob-day-error'] = true
      req.session.data['dob-month-error'] = true
    }
    // Missing day and year
    else if (!day && month && !year) {
      errors.push({
        text: "Enter a day and year",
        href: "#dob-day"
      })
      req.session.data['dob-error-message'] = "Enter a day and year"
      req.session.data['dob-day-error'] = true
      req.session.data['dob-year-error'] = true
    }
    // Missing month and year
    else if (day && !month && !year) {
      errors.push({
        text: "Enter a month and year",
        href: "#dob-month"
      })
      req.session.data['dob-error-message'] = "Enter a month and year"
      req.session.data['dob-month-error'] = true
      req.session.data['dob-year-error'] = true
    }
    // Missing only day
    else if (!day && month && year) {
      errors.push({
        text: "Enter a day",
        href: "#dob-day"
      })
      req.session.data['dob-error-message'] = "Enter a day"
      req.session.data['dob-day-error'] = true
    }
    // Missing only month
    else if (day && !month && year) {
      errors.push({
        text: "Enter a month",
        href: "#dob-month"
      })
      req.session.data['dob-error-message'] = "Enter a month"
      req.session.data['dob-month-error'] = true
    }
    // Missing only year
    else if (day && month && !year) {
      errors.push({
        text: "Enter a year",
        href: "#dob-year"
      })
      req.session.data['dob-error-message'] = "Enter a year"
      req.session.data['dob-year-error'] = true
    }
  }
  // 3. All fields filled - validate the date
  else {
    const dayNum = parseInt(day, 10)
    const monthNum = parseInt(month, 10)
    const yearNum = parseInt(year, 10)
    
    // Check if values are numbers
    const dayIsNaN = isNaN(dayNum)
    const monthIsNaN = isNaN(monthNum)
    const yearIsNaN = isNaN(yearNum)
    
    if (dayIsNaN || monthIsNaN || yearIsNaN) {
      hasError = true
      
      // All fields are not numbers
      if (dayIsNaN && monthIsNaN && yearIsNaN) {
        errors.push({
          text: "Enter a day, month and year using numbers only",
          href: "#dob-day"
        })
        req.session.data['dob-error-message'] = "Enter a day, month and year using numbers only"
        req.session.data['dob-day-error'] = true
        req.session.data['dob-month-error'] = true
        req.session.data['dob-year-error'] = true
      }
      // Day and month are not numbers
      else if (dayIsNaN && monthIsNaN && !yearIsNaN) {
        errors.push({
          text: "Enter a day and month using numbers only",
          href: "#dob-day"
        })
        req.session.data['dob-error-message'] = "Enter a day and month using numbers only"
        req.session.data['dob-day-error'] = true
        req.session.data['dob-month-error'] = true
      }
      // Day and year are not numbers
      else if (dayIsNaN && !monthIsNaN && yearIsNaN) {
        errors.push({
          text: "Enter a day and year using numbers only",
          href: "#dob-day"
        })
        req.session.data['dob-error-message'] = "Enter a day and year using numbers only"
        req.session.data['dob-day-error'] = true
        req.session.data['dob-year-error'] = true
      }
      // Month and year are not numbers
      else if (!dayIsNaN && monthIsNaN && yearIsNaN) {
        errors.push({
          text: "Enter a month and year using numbers only",
          href: "#dob-month"
        })
        req.session.data['dob-error-message'] = "Enter a month and year using numbers only"
        req.session.data['dob-month-error'] = true
        req.session.data['dob-year-error'] = true
      }
      // Only day is not a number
      else if (dayIsNaN && !monthIsNaN && !yearIsNaN) {
        errors.push({
          text: "Enter a day using numbers only",
          href: "#dob-day"
        })
        req.session.data['dob-error-message'] = "Enter a day using numbers only"
        req.session.data['dob-day-error'] = true
      }
      // Only month is not a number
      else if (!dayIsNaN && monthIsNaN && !yearIsNaN) {
        errors.push({
          text: "Enter a month using numbers only",
          href: "#dob-month"
        })
        req.session.data['dob-error-message'] = "Enter a month using numbers only"
        req.session.data['dob-month-error'] = true
      }
      // Only year is not a number
      else if (!dayIsNaN && !monthIsNaN && yearIsNaN) {
        errors.push({
          text: "Enter a year using numbers only",
          href: "#dob-year"
        })
        req.session.data['dob-error-message'] = "Enter a year using numbers only"
        req.session.data['dob-year-error'] = true
      }
    }
    // Check for invalid ranges
    else {
      const dayInvalid = (dayNum < 1 || dayNum > 31)
      const monthInvalid = (monthNum < 1 || monthNum > 12)
      const yearInvalid = (year.length !== 4)
      
      if (dayInvalid || monthInvalid || yearInvalid) {
        hasError = true
        
        // All fields invalid
        if (dayInvalid && monthInvalid && yearInvalid) {
          errors.push({
            text: "Enter a valid day, month and year",
            href: "#dob-day"
          })
          req.session.data['dob-error-message'] = "Enter a valid day, month and year"
          req.session.data['dob-day-error'] = true
          req.session.data['dob-month-error'] = true
          req.session.data['dob-year-error'] = true
        }
        // Day and month invalid
        else if (dayInvalid && monthInvalid && !yearInvalid) {
          errors.push({
            text: "Enter a valid day and month",
            href: "#dob-day"
          })
          req.session.data['dob-error-message'] = "Enter a valid day and month"
          req.session.data['dob-day-error'] = true
          req.session.data['dob-month-error'] = true
        }
        // Day and year invalid
        else if (dayInvalid && !monthInvalid && yearInvalid) {
          errors.push({
            text: "Enter a valid day and year",
            href: "#dob-day"
          })
          req.session.data['dob-error-message'] = "Enter a valid day and year"
          req.session.data['dob-day-error'] = true
          req.session.data['dob-year-error'] = true
        }
        // Month and year invalid
        else if (!dayInvalid && monthInvalid && yearInvalid) {
          errors.push({
            text: "Enter a valid month and year",
            href: "#dob-month"
          })
          req.session.data['dob-error-message'] = "Enter a valid month and year"
          req.session.data['dob-month-error'] = true
          req.session.data['dob-year-error'] = true
        }
        // Only day invalid
        else if (dayInvalid && !monthInvalid && !yearInvalid) {
          errors.push({
            text: "Enter a valid day",
            href: "#dob-day"
          })
          req.session.data['dob-error-message'] = "Enter a valid day"
          req.session.data['dob-day-error'] = true
        }
        // Only month invalid
        else if (!dayInvalid && monthInvalid && !yearInvalid) {
          errors.push({
            text: "Enter a valid month",
            href: "#dob-month"
          })
          req.session.data['dob-error-message'] = "Enter a valid month"
          req.session.data['dob-month-error'] = true
        }
        // Only year invalid
        else if (!dayInvalid && !monthInvalid && yearInvalid) {
          errors.push({
            text: "Enter a valid year",
            href: "#dob-year"
          })
          req.session.data['dob-error-message'] = "Enter a valid year"
          req.session.data['dob-year-error'] = true
        }
      }
      // Check if it's a valid calendar date (e.g., not 31st Feb or a non-leap year 29th Feb)
      else {
        const date = new Date(yearNum, monthNum - 1, dayNum)
        const isValidDate = date.getDate() === dayNum && 
                           date.getMonth() === monthNum - 1 && 
                           date.getFullYear() === yearNum
        
        if (!isValidDate) {
          hasError = true
          errors.push({
            text: "Enter a valid date",
            href: "#dob-day"
          })
          req.session.data['dob-error-message'] = "Enter a valid date"
          req.session.data['dob-day-error'] = true
          req.session.data['dob-month-error'] = true
          req.session.data['dob-year-error'] = true
        }
        // Check if date is in the future
        else {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          if (date > today) {
            hasError = true
            errors.push({
              text: "Date of birth must be in the past",
              href: "#dob-day"
            })
            req.session.data['dob-error-message'] = "Date of birth must be in the past"
            req.session.data['dob-day-error'] = true
            req.session.data['dob-month-error'] = true
            req.session.data['dob-year-error'] = true
          }
          // Check if age is more than 120 years old
          else {
            const maxAge = 120
            const oldestAllowedDate = new Date()
            oldestAllowedDate.setFullYear(oldestAllowedDate.getFullYear() - maxAge, 0, 1)
            
            if (date < oldestAllowedDate) {
              hasError = true
              errors.push({
                text: "Please check the year you were born",
                href: "#dob-year"
              })
              req.session.data['dob-error-message'] = "Please check the year you were born"
              req.session.data['dob-year-error'] = true
            }
          }
        }
      }
    }
  }
      // Handle the result
      if (hasError) {
        req.session.data['dob-error'] = 'true'
        req.session.data['dob-error-list'] = errors
        res.redirect('/date-of-birth')
      } else {
        // Clear all errors
        req.session.data['dob-error'] = 'false'
        req.session.data['dob-error-message'] = ''
        req.session.data['dob-error-list'] = []
        req.session.data['dob-day-error'] = false
        req.session.data['dob-month-error'] = false
        req.session.data['dob-year-error'] = false
        
        // Continue to next page
        res.redirect('/sds-number')
    }
})

// Clear errors when navigating to other pages
router.get('/privacy-notice', function (req, res) {
  // Clear date errors when going back
  req.session.data['dob-error'] = 'false'
  req.session.data['dob-error-message'] = ''
  req.session.data['dob-error-list'] = []
  req.session.data['dob-day-error'] = false
  req.session.data['dob-month-error'] = false
  req.session.data['dob-year-error'] = false
  
  res.render('privacy-notice')
})

router.get('/sds-number', function (req, res) {
  // Clear errors from previous page
  req.session.data['dob-error'] = 'false'
  req.session.data['dob-error-message'] = ''
  req.session.data['dob-error-list'] = []
  
  res.render('sds-number')
})



// SDS number validation routes

// Display the SDS number page
router.get('/sds-number', function (req, res) {
  // Don't clear errors - let them persist from POST
  res.render('sds-number')
})

// Handle SDS number form submission
router.post('/sds-number', function (req, res) {
  // Get the SDS number and trim whitespace
  let sdsNumber = req.body['sdsNumber'] ? req.body['sdsNumber'].trim() : ''
  
  // Always save the raw input first (helps redisplay in case of error)
  req.session.data['sdsNumber'] = sdsNumber
  
  // Reset error state
  let hasError = false
  let errorMessage = ''
  
  // VALIDATION LOGIC

  // 1. Check if empty
  if (!sdsNumber) {
    hasError = true
    errorMessage = 'Enter your SDS number'
  }
  // 2. Check if it contains only numbers
  else if (!/^\d+$/.test(sdsNumber)) {
    hasError = true
    errorMessage = 'SDS number must only include numbers'
  }
  // 3. Check if it starts with 0
  else if (!sdsNumber.startsWith('0')) {
    hasError = true
    errorMessage = 'SDS number must start with a 0'
  }
  // 4. Check if it's 10 digits
  else if (sdsNumber.length < 10 || sdsNumber.length > 10) {
    hasError = true
    errorMessage = 'SDS number must be 10 digits long'
  }
  // 5. Optional: Check for specific invalid patterns
  else if (sdsNumber === '0000000000') {
    hasError = true
    errorMessage = 'Enter a valid SDS number'
  }

  // Handle the result
  if (hasError) {
    req.session.data['sds-error'] = 'true'
    req.session.data['sds-error-message'] = errorMessage
    res.redirect('/sds-number')
  } else {
    // Clear error
    req.session.data['sds-error'] = 'false'
    req.session.data['sds-error-message'] = ''
    
    // Check if SDS number is in the no-record range (0000000001 to 0000000009)
    const sdsNumberInt = parseInt(sdsNumber, 10)
    if (sdsNumberInt >= 1 && sdsNumberInt <= 9) {
      // Redirect to no record found page
      res.redirect('/no-record-found')
    } else {
      // Continue to confirm seafarer record page
      res.redirect('/confirm-seafarer-record')
    }
  }
})

// Route for no record found page
router.get('/no-record-found', function (req, res) {
  res.render('no-record-found')
})




// Confirm seafarer record routes

// Display the confirm seafarer record page
router.get('/confirm-seafarer-record', function (req, res) {
  // Don't clear errors - let them persist from POST
  res.render('confirm-seafarer-record')
})

// Handle confirm seafarer record form submission
router.post('/confirm-seafarer-record', function (req, res) {
  // Get the radio button value
  let confirmRecord = req.body['confirmRecord']
  
  // Handle if value comes as array (like checkboxes sometimes do)
  if (Array.isArray(confirmRecord)) {
    confirmRecord = confirmRecord[0]
  }
  
  // Always save the selection
  req.session.data['confirmRecord'] = confirmRecord
  
  // Check if a radio button was selected
  if (!confirmRecord) {
    // No selection - set error and redirect back
    req.session.data['confirm-error'] = 'true'
    res.redirect('/confirm-seafarer-record')
  } else {
    // Clear error
    req.session.data['confirm-error'] = 'false'
    
    // Redirect based on selection
    if (confirmRecord === 'yes') {
      res.redirect('/contact-email')
    } else {
      res.redirect('/help-finding-your-record')
    }
  }
})

// Clear errors when navigating to other pages
router.get('/sds-number', function (req, res) {
  // Clear confirm errors when going back
  req.session.data['confirm-error'] = 'false'
  req.session.data['confirmRecord'] = ''
  
  res.render('sds-number')
})

router.get('/contact-email', function (req, res) {
  // Clear errors from previous page
  req.session.data['confirm-error'] = 'false'
  
  res.render('contact-email')
})

router.get('/help-finding-your-record', function (req, res) {
  // Clear errors from previous page
  req.session.data['confirm-error'] = 'false'
  
  res.render('help-finding-your-record')
})








// Choose a slot routes

// Display the choose a slot page
router.get('/choose-a-slot', function (req, res) {
  // Get selected date from query parameter or session
  const selectedDate = req.query.selectedDate || req.session.data['selectedDate'] || '2025-08-09'
  
  if (selectedDate) {
    req.session.data['selectedDate'] = selectedDate
  }
  
  // Don't clear errors - let them persist from POST
  res.render('choose-a-slot')
})

// Handle slot selection
router.post('/choose-a-slot', function (req, res) {
  // Get the selected slot time
  let appointmentSlot = req.body['appointmentSlot']
  const selectedDate = req.body['selectedDate']
  
  // Handle if value comes as array
  if (Array.isArray(appointmentSlot)) {
    appointmentSlot = appointmentSlot[0]
  }
  
  // Always save the values
  req.session.data['appointmentSlot'] = appointmentSlot
  req.session.data['selectedDate'] = selectedDate
  
  // Check if a slot was selected
  if (!appointmentSlot) {
    // No selection - set error and redirect back
    req.session.data['slot-error'] = 'true'
    res.redirect('/choose-a-slot')
  } else {
    // Clear error
    req.session.data['slot-error'] = 'false'
    
    // Continue to next page (e.g., confirm appointment)
    res.redirect('/confirm-appointment')
  }
})

// Clear errors when navigating to other pages
router.get('/select-date', function (req, res) {
  // Clear slot errors when going back
  req.session.data['slot-error'] = 'false'
  req.session.data['appointmentSlot'] = ''
  
  res.render('select-date')
})

router.get('/find-test-centre', function (req, res) {
  // Clear slot selection when choosing different centre
  req.session.data['slot-error'] = 'false'
  req.session.data['appointmentSlot'] = ''
  
  res.render('find-test-centre')
})

router.get('/confirm-appointment', function (req, res) {
  // Clear errors from previous page
  req.session.data['slot-error'] = 'false'
  
  res.render('confirm-appointment')
})



// Contact email validation routes

// Display the contact details page (assuming your page is named contact-email.html)
router.get('/contact-email', function (req, res) {
  // Clear errors on normal page load
  req.session.data['contact-email-error'] = 'false'
  res.render('contact-email')
})

// Handle contact email form submission
router.post('/contact-email-check', function (req, res) {
  // Get the radio button value
  let correctEmail = req.body['correctEmail']
  
  // Handle if value comes as array
  if (Array.isArray(correctEmail)) {
    correctEmail = correctEmail[0]
  }
  
  // Always save the selection
  req.session.data['correctEmail'] = correctEmail
  
  // Check if a radio button was selected
  if (!correctEmail) {
    // No selection - set error and redirect back
    req.session.data['contact-email-error'] = 'true'
    res.redirect('/contact-email')
  } else {
    // Clear error
    req.session.data['contact-email-error'] = 'false'
    
    // Redirect based on selection
    if (correctEmail === 'yes') {
      // Email is correct - go to oral examinations dashboard
      res.redirect('/dashboard')
    } else {
      // Email needs updating - go to update email page
      res.redirect('/how-to-update-contact-information')
    }
  }
})

// Clear errors when navigating to other pages
router.get('/dashboard', function (req, res) {
  // Clear errors from previous page
  req.session.data['contact-email-error'] = 'false'
  
  res.render('dashboard')
})

router.get('/update-email', function (req, res) {
  // Clear errors from previous page
  req.session.data['contact-email-error'] = 'false'
  
  res.render('update-email')
})




// Update email routes with validation

// Display the update email page
router.get('/update-email', function (req, res) {
  // Don't clear errors - let them persist from POST
  res.render('update-email')
})

// Handle update email form submission
router.post('/update-email', function (req, res) {
  // Get the email values and trim whitespace
  const email = req.body['email'] ? req.body['email'].trim() : ''
  const emailConfirm = req.body['emailConfirm'] ? req.body['emailConfirm'].trim() : ''
  
  // Always save the form values
  req.session.data['email'] = email
  req.session.data['emailConfirm'] = emailConfirm
  
  // Reset error states
  let errors = []
  let hasError = false
  req.session.data['email-field-error'] = false
  req.session.data['email-confirm-error'] = false
  
  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  // VALIDATION LOGIC
  
  // 1. Check if both fields are empty
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
  }
  // 2. Check if first email is empty
  else if (!email) {
    hasError = true
    errors.push({
      text: "Enter your email address",
      href: "#email"
    })
    req.session.data['email-field-error'] = "Enter your email address"
  }
  // 3. Check if confirm email is empty
  else if (!emailConfirm) {
    hasError = true
    errors.push({
      text: "Confirm your email address",
      href: "#email-confirm"
    })
    req.session.data['email-confirm-error'] = "Confirm your email address"
  }
  // 4. Check if first email is valid format
  else if (!emailRegex.test(email)) {
    hasError = true
    errors.push({
      text: "Enter a valid email address",
      href: "#email"
    })
    req.session.data['email-field-error'] = "Enter a valid email address"
  }
  // 5. Check if confirm email is valid format
  else if (!emailRegex.test(emailConfirm)) {
    hasError = true
    errors.push({
      text: "Enter a valid email address",
      href: "#email-confirm"
    })
    req.session.data['email-confirm-error'] = "Enter a valid email address"
  }
  // 6. Check if emails match
  else if (email !== emailConfirm) {
    hasError = true
    errors.push({
      text: "Email addresses do not match",
      href: "#email-confirm"
    })
    req.session.data['email-confirm-error'] = "Email addresses do not match"
  }
  
  // Handle the result
  if (hasError) {
    req.session.data['email-error'] = 'true'
    req.session.data['email-error-list'] = errors
    res.redirect('/update-email')
  } else {
    // Clear all errors
    req.session.data['email-error'] = 'false'
    req.session.data['email-field-error'] = false
    req.session.data['email-confirm-error'] = false
    req.session.data['email-error-list'] = []
    
    // Store the confirmed email
    req.session.data['updatedEmail'] = email
    
    // Continue to oral examinations dashboard
    res.redirect('/oral-examinations-dashboard')
  }
})

// Clear errors when navigating to other pages
router.get('/contact-details', function (req, res) {
  // Clear email errors when going back
  req.session.data['email-error'] = 'false'
  req.session.data['email-field-error'] = false
  req.session.data['email-confirm-error'] = false
  req.session.data['email'] = ''
  req.session.data['emailConfirm'] = ''
  
  res.render('contact-details')
})

router.get('/dashboard', function (req, res) {
  // Clear errors from previous page
  req.session.data['email-error'] = 'false'
  req.session.data['email-field-error'] = false
  req.session.data['email-confirm-error'] = false
  
  res.render('dashboard')
})

// Calendar Date Picker GET
router.get('/enter-a-date-for-a-slot', function (req, res) {
  res.render('enter-a-date-for-a-slot', { data: req.query });
});

// Calendar Date Picker POST if needed
router.post('/choose-a-slot/', function (req, res) {
  res.redirect('/choose-a-slot');
});

// RESCHEDULE Calendar Date Picker GET
router.get('/reschedule-enter-a-date-for-a-slot', function (req, res) {
  res.render('reschedule-enter-a-date-for-a-slot', { data: req.query });
});

// RESCHEDULE Calendar Date Picker POST if needed
router.post('/reschedule-choose-a-slot/', function (req, res) {
  res.redirect('/reschedule-choose-a-slot');
});


// Route for the cancel exam booking page (GET)
// This clears errors when the page is loaded/refreshed
router.get('/cancel-exam-booking', function(req, res) {
  // Clear any existing errors when page is loaded
  delete req.session.data['confirm-error'];
  delete req.session.data['other-reason-error'];
  
  res.render('cancel-exam-booking');
});

// Route handler for cancel exam booking form submission (POST)
router.post('/cancel-exam-booking', function(req, res) {
  // Get the submitted data
  const confirmRecord = req.body.confirmRecord;
  const otherReason = req.body.otherReason;
  
  // Clear previous errors first
  delete req.session.data['confirm-error'];
  delete req.session.data['other-reason-error'];
  
  // Validation flag
  let hasError = false;
  
  // Check if no radio option is selected
  if (!confirmRecord) {
    req.session.data['confirm-error'] = 'true';
    hasError = true;
  }
  
  // Check if 'other' is selected but text input is empty
  if (confirmRecord === 'other' && (!otherReason || otherReason.trim() === '')) {
    req.session.data['other-reason-error'] = 'true';
    hasError = true;
  }
  
  // If there are errors, redirect back to the form
  if (hasError) {
    // Store the submitted values so they persist
    req.session.data.confirmRecord = confirmRecord;
    req.session.data.otherReason = otherReason;
    return res.redirect('/cancel-exam-booking');
  }
  
  // No errors - store the data and move forward
  req.session.data.confirmRecord = confirmRecord;
  req.session.data.otherReason = otherReason;
  
  // Store the cancellation reason for display
  if (confirmRecord === 'other') {
    req.session.data.cancellationReason = otherReason;
  } else {
    req.session.data.cancellationReason = confirmRecord;
  }
  
  // Store exam details
  req.session.data.examType = 'Marine Engine Operator Licence (MEOL) and Senior MEOL';
  req.session.data.examDateTime = '13:30 (BST), 16 September 2025';
  
  // Redirect to check your answers page
  res.redirect('/cancellation-check-your-answers');
});

// Route for check your answers page
router.get('/cancellation-check-your-answers', function(req, res) {
  // Clear any errors that might have persisted
  delete req.session.data['confirm-error'];
  delete req.session.data['other-reason-error'];
  
  res.render('cancellation-check-your-answers');
});


// ============================================
// ADD THIS TO YOUR app/routes.js FILE
// ============================================

// Route for the cancel exam booking 21 days page (GET)
// This clears errors when the page is loaded/refreshed
router.get('/cancel-exam-booking-21days', function(req, res) {
  // Clear any existing errors when page is loaded
  delete req.session.data['confirm-error'];
  delete req.session.data['other-reason-error'];
  
  res.render('cancel-exam-booking-21days');
});

// Route handler for cancel exam booking 21 days form submission (POST)
router.post('/cancel-exam-booking-21days', function(req, res) {
  // Get the submitted data
  const confirmRecord = req.body.confirmRecord;
  const otherReason = req.body.otherReason;
  
  // Clear previous errors first
  delete req.session.data['confirm-error'];
  delete req.session.data['other-reason-error'];
  
  // Validation flag
  let hasError = false;
  
  // Check if no radio option is selected
  if (!confirmRecord) {
    req.session.data['confirm-error'] = 'true';
    hasError = true;
  }
  
  // Check if 'other' is selected but text input is empty
  if (confirmRecord === 'other' && (!otherReason || otherReason.trim() === '')) {
    req.session.data['other-reason-error'] = 'true';
    hasError = true;
  }
  
  // If there are errors, redirect back to the form
  if (hasError) {
    // Store the submitted values so they persist
    req.session.data.confirmRecord = confirmRecord;
    req.session.data.otherReason = otherReason;
    return res.redirect('/cancel-exam-booking-21days');
  }
  
  // No errors - store the data and move forward
  req.session.data.confirmRecord = confirmRecord;
  req.session.data.otherReason = otherReason;
  
  // Store the cancellation reason for display
  if (confirmRecord === 'other') {
    req.session.data.cancellationReason = otherReason;
  } else {
    req.session.data.cancellationReason = confirmRecord;
  }
  
  // Store exam details
  req.session.data.examType = 'Marine Engine Operator Licence (MEOL) and Senior MEOL';
  req.session.data.examDateTime = '13:30 (BST), 16 September 2025';
  
  // Redirect to check your answers 21 days page
  res.redirect('/cancellation-check-your-answers-21days');
});

// Route for check your answers 21 days page
router.get('/cancellation-check-your-answers-21days', function(req, res) {
  // Clear any errors that might have persisted
  delete req.session.data['confirm-error'];
  delete req.session.data['other-reason-error'];
  
  res.render('cancellation-check-your-answers-21days');
});