import { ChatMessageRoleEnum, CortexStep, internalMonologue } from "socialagi";
import { MentalProcess, useActions, useProcessMemory } from "soul-engine";
import { prompt } from "../lib/prompt.js";

const summaryOfSeriesOfEvents = (existing: string) => () => ({
  command: ({ entityName: name }: CortexStep) => {
    return prompt`
      ## Existing notes
      ${existing}

      ## Description
      Write an updated and clear paragraph describing everything that happened so far.
      Make sure to keep details that ${name} would want to remember.

      ## Rules
      * Keep descriptions as a paragraph
      * Keep relevant information from before
      * Use abbreviated language to keep the notes short
      * Make sure to detail the motivation of ${name} (what are they trying to accomplish, what have they done so far).

      Please reply with the updated notes on the series of events:
  `;
  },
});

const summarizesSeriesOfEvents: MentalProcess = async ({ step: initialStep }) => {
  const seriesOfEventsModel = useProcessMemory(prompt`
    ${initialStep.entityName} is experiencing a series of events and is trying to learn as much as possible about them.
  `);
  const { log: engineLog } = useActions();
  const log = (...args: any[]) => {
    engineLog("[summarizes]", ...args);
  };

  let step = initialStep;
  let finalStep = initialStep;

  if (step.memories.length > 10) {
    log("Updating notes");
    step = await step.next(internalMonologue("What have I learned so far.", "noted"));

    const updatedNotes = await step.compute(summaryOfSeriesOfEvents(seriesOfEventsModel.current));
    seriesOfEventsModel.current = updatedNotes as string;

    return finalStep.withUpdatedMemory(async (memories) => {
      const newMemories = memories.flat();
      return [
        newMemories[0],
        {
          role: ChatMessageRoleEnum.Assistant,
          content: prompt`
            ## Events so far
            ${updatedNotes}
          `,
          metadata: {
            conversationSummary: true,
          },
        },
        ...newMemories.slice(-8),
      ];
    });
  }

  return finalStep;
};

export default summarizesSeriesOfEvents;
