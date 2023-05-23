import React, { useState } from "react";
import { Box } from "@chakra-ui/react";
import { Resizable } from "re-resizable";

const MainArea = () => {
  const [topHeight, setTopHeight] = useState("80%");
  const [bottomHeight, setBottomHeight] = useState("20%");
  const gap = 1; // The gap between boxes in percentage.

//   const handleResize = (type, e, direction, ref, d) => {
//     const deltaHeightPercent = (d.height / window.innerHeight) * 100;

//     if (type === "top") {
//       const newTopHeight = parseFloat(topHeight) + deltaHeightPercent;
//       const newBottomHeight = parseFloat(bottomHeight) - deltaHeightPercent;
//       setTopHeight(`${newTopHeight}%`);
//       setBottomHeight(`${newBottomHeight}%`);
//     } else if (type === "bottom") {
//       const newTopHeight = parseFloat(topHeight) - deltaHeightPercent;
//       const newBottomHeight = parseFloat(bottomHeight) + deltaHeightPercent;
//       setTopHeight(`${newTopHeight}%`);
//       setBottomHeight(`${newBottomHeight}%`);
//     }
//   };
const handleResize = (type, e, direction, ref, d) => {
    const deltaHeightPercent = (d.height / window.innerHeight) * 100;
  
    if (type === "top") {
      const newTopHeight = parseFloat(topHeight) + deltaHeightPercent;
      const newBottomHeight = parseFloat(bottomHeight) - deltaHeightPercent;
      console.log("newTopHeight: " + newTopHeight)
      console.log("newBottomHeight: " + newBottomHeight)
      setTopHeight(`${newTopHeight}%`);
      setBottomHeight(`${newBottomHeight}%`);
    } else if (type === "bottom") {
      const newTopHeight = parseFloat(topHeight) - deltaHeightPercent;
      const newBottomHeight = parseFloat(bottomHeight) + deltaHeightPercent;
      console.log("newTopHeight: " + newTopHeight)
      console.log("newBottomHeight: " + newBottomHeight)
      setTopHeight(`${newTopHeight}%`);
      setBottomHeight(`${newBottomHeight}%`);
    }
  };

  return (
    <Box h="100vh" w="100%" bg="gray.100" borderRadius="md" p={0} position="relative">
      <Resizable
        size={{
          width: "100%",
          height: topHeight,
        }}
        maxHeight="90%"
        minHeight="10%"
        maxWidth="100%"
        minWidth="50%"
        onResizeStop={(e, direction, ref, d) => handleResize("top", e, direction, ref, d)}
      >
        <Box
          border="1px solid"
          borderColor="gray.300"
        //   borderRadius="md"
        //   marginBottom={1}
          bg="gray.100"
          overflow="hidden"
          h="100%"
          w="100%"
        >
          {/* Your main content view goes here */}
        </Box>
      </Resizable>
      <Resizable
        size={{
          width: "100%",
          height: bottomHeight,
        }}
        maxHeight="90%"
        minHeight="10%"
        maxWidth="100%"
        minWidth="50%"
        enable={{
          top: true,
          right: false,
          bottom: false,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
        style={{
          position: "absolute",
          bottom: 0,
        }}
        onResizeStop={(e, direction, ref, d) => handleResize("bottom", e, direction, ref, d)}
      >
        <Box
          border="1px solid"
          borderColor="gray.300"
        //   borderRadius="md"
        //   marginTop={1}
          bg="white"
          overflow="hidden"
          h="100%"
          w="100%"
        >
          {/* Your tabbed view with tools/interactions goes here */}
        </Box>
      </Resizable>
    </Box>
  );
};

export default MainArea;
