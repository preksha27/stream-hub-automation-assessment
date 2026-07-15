Feature: EMI Calculator Validation
  As a QA engineer
  I want to validate EMI calculator charts and computations
  So that the application displays correct data to users

  Background:
    Given I open the EMI calculator application

  @pie-chart @home-loan
  Scenario Outline: Validate the EMI Pie Chart for Home Loan
    When I navigate to the "Home Loan" tab
    And I set the Home Loan Amount to "<amount>" lakhs
    And I set the Interest Rate to "<rate>" percent
    And I set the Loan Tenure to "<tenure>" years
    Then the pie chart should be visible
    And the pie chart values should be greater than zero
    And the calculated EMI should match the displayed EMI

    Examples:
      | amount | rate | tenure |
      | 25     | 10   | 10     |
      | 50     | 7.5  | 15     |

  @bar-chart @personal-loan
  Scenario: Validate the EMI Bar Chart for Personal Loan
    When I navigate to the "Personal Loan" tab
    And I set the Personal Loan Amount to "10" lakhs
    And I set the Interest Rate to "12" percent
    And I set the Loan Tenure to "5" years
    And I modify the schedule start month
    Then the bar chart should be visible
    And the bar chart should have bars displayed
    And the tooltip of the first bar should show a value
