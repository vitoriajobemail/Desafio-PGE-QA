Cypress.Commands.add('login', (userEmail, userPassword) => {
  cy.env(['USER_EMAIL', 'USER_PASSWORD']).then(({ USER_EMAIL, USER_PASSWORD }) => {
    const email = userEmail || USER_EMAIL
    const password = userPassword || USER_PASSWORD

    cy.session([email, password], () => {
      cy.visit('/admins/sign_in')

      cy.get('#admin_email').should('be.visible').clear().type(email)
      cy.get('#admin_password').should('be.visible').clear().type(password)
      cy.get('input[type="submit"][name="commit"]').click()
      cy.url().should('not.include', '/admins/sign_in')
    }, 
    { 
      cacheAcrossSpecs: true
    })
  })
})