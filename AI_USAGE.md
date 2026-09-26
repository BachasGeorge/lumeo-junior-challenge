# AI usage report

Rename this file to `AI_USAGE.md` and complete it before submitting.

## Tools used

Claude (specifically Opus 5.5).

## How I used them

I used the AI as a consultant for some decisions and to write me code. The general ideas were mine and we just worked on them to
fill holes in my logic. Testing cases were mostly mine and the LLM suggested some more and wrote the code. Security and validation
checks in the app.ts file were mostly suggested and implemented from the LLM due to lack of knowledge on the field. Same for the
front end part of the challenge, I provided the wanted changes and with a bit of directing the LLM did the job.
I also used to to explain to me some existing architecture logic and code that I did not fully understand, for example how the repository.ts
works now that we don't use an actual API to get our data.

## Example of an incorrect or incomplete result

Describe at least one suggestion that was incorrect, insecure, incomplete, or unsuitable for this project.

## How I identified and corrected it

Explain the checks, tests, documentation, or reasoning you used.

## My review and modifications

I reviewd all the parts that the LLM wrote and asked for validation from it's part. If I considered the validation correct and the final result
acceptable then no changes were made. In some cases small fixes were made but nothing too serious.

## Additional notes

I do not fully agree with the EPSILON usage in the verification.ts. It is used to eliminate extremelly small differences that occur due to how
the computer handles substraction, but I believe and I know that there is a better way, I can even implement it but it will be complicated. The
task is to make simple solutions so I kept the LLMs way.
