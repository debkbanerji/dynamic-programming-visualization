# Dynamic Programming Visualization

In browser visualization for dynamic programming algorithms

## Creating a Problem

If you'd like to create your own problem, it is recommended that you modify one of the `.dp.json` problem files in `src/assets/problems`. The field names should be pretty self explanatory. Note that every problem must have bottom up code defined, but a top down solution is optional - if top down code is not included, this option will not be shown to the user.

Problems may also optionally have a more detailed solution in addition to the default result (for example, the subsequence itself in addition to the length of the subsequence for the longest increasing subsequence problem). In this case, the `solution` field in `output` must also be defined alongside the necessary code. Note that if you're also allowing for top down code, you must also create a detailed version of the top down code for finding the full solution. (For a total of 4 different versions of the problem)

It's nice to have a good variety of test cases, in order to cover edge cases. A large number of test cases also helps with debugging as well as making sure a bad solution doesn't pass all test cases. Also, make sure none of your tet cases are very large, since those aren't always useful, they don't display well and the application actually has to process each test case, often multiple times.

Note that only the input of each test case is defined - the output is generated automatically based on your provided code, so make sure it's correct. (and your inputs are valid) One of the reasons for this is that it is extremely tedious to manually step through large inputs and lay out the expected outputs. Another is that the application needs to actually run the provided code in order to generate the corresponding animation. 

You can test the problem you've created by using the custom problem section of the application's home page. If there is an issue with your problem, it is recommended you first compare it with one of the existing problems. If this does not fix your issue, try running the app locally and stepping through the source code. (It is much more difficult to pinpoint the lines that are causing issues in the built version of the application)

## Contributing a Problem

If you want to contribute a problem you've created to the application, add the problem's `.dp.json` file to `src/assets/problems` and modify the `sections` field within `src\assets/problems/problem-directory.json`. Then, make a pull request on the GitHub Page. Make sure to test the problem before submitting it.

## Starting a Development Server

You'll first need to install `node.js` and `npm`. Then, run `npm install` in the source code directory followed `npm run develop` and navigate to `localhost:4200` to begin development

## Building the app

Run `npm run build` to build the app. The built app can be found within `dist`

## Distribution

You may want to build and distribute a version of this software for educational purposes, likely with a modified problem set (you can do this while leaving the rest of the code untouched by modifying the problems and problem directory within `assets/problems`). If you choose to do this, it is highly recommended that you build the app using the instructions outlined above and deploy the static files to your server, with a different version defined in the top level `package.json`. (this is what is displayed to the user) If you choose to do this, please do not modify the section of the page crediting the original author(s). Also, note that any problems distributed with the master version of this application are publicly available alongside the source code on its GitHub page. Finally, be aware that this software is designed as a learning tool and so should not be used to evaluate students.
