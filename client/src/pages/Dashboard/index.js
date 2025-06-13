import * as React from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { Button, Divider, Modal, Skeleton, Typography } from "@mui/material";
import { useState } from "react";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 4,
  p: 4,
};

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState({});
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  function handleSelect(item) {
    setSelected((prev) => {
      if (item.id in prev) {
        delete prev[item.id];
        return prev;
      }

      return {
        ...prev,
        [item.id]: item,
      };
    });
  }

  React.useEffect(() => {
    fetchSampleRecommendations();
  }, []);

  async function fetchSampleRecommendations() {
    setResults([]);
    setLoading(true);

    setTimeout(() => {
      setResults([
        {
          id: "1",
          name: "Movement-Based Attention Boost",
          description:
            "Incorporate short, scheduled movement breaks every 15-20 minutes using activities like stretching, balance exercises, or guided physical prompts. These micro-breaks aim to reset attention and improve cognitive control for children who struggle with sustained focus.",
        },
        {
          id: "2",
          name: "Peer Buddy Co-Regulation",
          description:
            "Pair the student with a trained peer buddy who models attention skills and helps redirect the student with nonverbal cues (e.g., hand signals, desk prompts). The peer provides subtle support during lessons, reducing teacher intervention and promoting self-monitoring.",
        },
        {
          id: "3",
          name: "Sensory Modulation Toolkit",
          description:
            "Provide the student with a personalized sensory toolkit (e.g., textured items, putty, fidget tools, noise-canceling headphones). The toolkit allows the student to self-select sensory input to help regulate arousal and maintain focus during instructional periods.",
        },
      ]);
      setLoading(false);
    }, 50);
  }

  async function fetchRecommendations() {
    setLoading(true);

    const prompt = `
You are a behavioral psychologist and you work with kids that have trouble paying attention in school. You need to come up with interventions to help the kid behave. What you have been trying doesn't work according to some data.

Return exactly 3 novel interventions in STRICT JSON format, without any extra text, in this format:

[
  {
    "id": "<uuid>",
    "name": "<short title>",
    "description": "<detailed description>"
  }
]
`;
    try {
      const response = await fetch("/interventions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setResults(JSON.parse(data.result));
    } catch (err) {
      console.error(err);
      setResults("Error fetching recommendations.");
    } finally {
      setLoading(false);
    }
  }

  function getContent() {
    if (loading) {
      return (
        <Box>
          <Skeleton animation="wave" height={50} />
          <Skeleton animation="wave" height={50} />
          <Skeleton animation="wave" height={50} />
        </Box>
      );
    }

    if (results.length > 0) {
      return (
        <Box>
          <List>
            {results.map((result) => {
              return (
                <ListItem
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  disablePadding
                  sx={{
                    margin: "8px 0",
                    bgcolor: result.id in selected ? "primary.light" : "none",
                    "&:hover": {
                      bgcolor: "primary.light",
                      cursor: "pointer",
                    },
                  }}
                >
                  <ListItemText
                    primary={result.name}
                    secondary={result.description}
                  ></ListItemText>
                </ListItem>
              );
            })}
          </List>
        </Box>
      );
    }

    return <Box pt="8px">No recommendations</Box>;
  }

  const content = getContent();
  const selectedValues = Object.values(selected).filter(Boolean);
  console.log(selected);
  return (
    <Box padding="24px">
      <Typography variant="h4" mb="12px">
        Inverventions
      </Typography>
      <Box marginBottom="24px">
        <Button variant="contained" onClick={fetchRecommendations}>
          Get AI recommendations
        </Button>
      </Box>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", gap: "12px" }}
      >
        <Box flex={1}>
          <Typography variant="h5">Current</Typography>
          <List>
            <ListItem disablePadding key="current">
              <ListItemText
                primary="Teacher Helper"
                secondary="Helping the teacher as a reward"
              ></ListItemText>
            </ListItem>
          </List>
        </Box>
        <Divider flexItem orientation="vertical" />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h5">Recommendations</Typography>
            <Button
              onClick={handleOpen}
              variant="contained"
              size="small"
              disabled={selectedValues.length === 0}
            >
              Add to student
            </Button>
          </Box>
          {content}
        </Box>
      </Box>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography
            id="modal-modal-title"
            variant="h5"
            sx={{ marginBottom: "8px", textAlign: "center" }}
          >
            Add {selectedValues.length} invervention
            {selectedValues.length > 1 ? "s" : ""} to student
          </Typography>
          <List sx={{ paddingLeft: "32px", listStyleType: "disc" }}>
            {Object.keys(selected).map((key) => {
              return (
                <ListItem
                  key={selected[key].id}
                  sx={{ display: "list-item", padding: 0 }}
                >
                  {selected[key].name}
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Modal>
    </Box>
  );
}
