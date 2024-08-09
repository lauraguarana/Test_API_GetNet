
const createTokenRequest = (cardNumber, customerId, expirationMonth, expirationYear, securityCode) => ({
  card_number: cardNumber,
  customer_id: customerId,
  expiration_month: expirationMonth,
  expiration_year: expirationYear,
  security_code: securityCode,
});

describe('API Tokenization Tests', () => {
  const clientId = '67823c6d-58de-494f-96d9-86a4c22682cb';
  const clientSecret = 'c2d6a06f-5f31-448b-9079-7e170e8536e4';
  const authUrl = 'https://api-homologacao.getnet.com.br/auth/oauth/v2/token';
  const tokenizationUrl = 'https://api-homologacao.getnet.com.br/v1/tokenization';
  let accessToken;

  before(() => {
    cy.request({
      method: 'POST',
      url: authUrl,
      form: true,
      body: {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      accessToken = response.body.access_token;
    });
  });

  it('should validate tokenization endpoint', () => {
    const requestBody = createTokenRequest(
      '5155901222280001', // Card Number
      'customer_12345',  // Customer ID
      '12',              // Expiration Month
      '25',              // Expiration Year
      '123'              // Security Code
    );

    cy.request({
      method: 'POST',
      url: tokenizationUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: requestBody,
      failOnStatusCode: false // Ignorar falhas de código de status
    }).then((response) => {
      cy.log(`Response status: ${response.status}`);
      cy.log(`Response body: ${JSON.stringify(response.body)}`);

      if (response.status >= 200 && response.status < 300) {
          expect(response.status).to.eq(201);

        expect(response.body).to.have.property('number_token');
        expect(response.body).to.have.property('customer_id', requestBody.customer_id);

        expect(response.body).to.have.keys(['number_token', 'customer_id']);
      } else {
        throw new Error(`Erro inesperado: ${response.status}. Verifique a URL: ${tokenizationUrl}`);
      }
    });
  });

  it('should validate required fields', () => {
    const incompleteRequestBody = createTokenRequest(
      '5155901222280001',
      'customer_12345',   
      '',                 
      '',                 
      ''
    );

    cy.request({
      method: 'POST',
      url: tokenizationUrl,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: incompleteRequestBody,
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`Response status: ${response.status}`);
      cy.log(`Response body: ${JSON.stringify(response.body)}`);

      expect(response.status).to.eq(400);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('expiration_month');
      expect(response.body.error).to.include('expiration_year');
      expect(response.body.error).to.include('security_code');
    });
  });
});
