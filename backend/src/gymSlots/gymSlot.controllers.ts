import { Request, Response } from "express";
import { GymSlot } from "./gymSlot.model";
import { ICreateGymSlot, IUpdateGymSlot } from "@/types/gymSlot.types";

// Create or update gym slots for a specific day
export const createOrUpdateGymSlots = async (
  req: Request<{ gymId: string }, {}, ICreateGymSlot>,
  res: Response<{ success: boolean; gymSlot?: any; error?: string }>
) => {
  try {
    const { gymId } = req.params;
    const { dayOfWeek, slots, isClosed } = req.body;

    // Find existing slot for this gym and day
    let gymSlot = await GymSlot.findOne({ gymId, dayOfWeek });

    if (gymSlot) {
      // Update existing
      gymSlot.slots = slots;
      gymSlot.isClosed = isClosed;
      await gymSlot.save();
    } else {
      // Create new
      gymSlot = await GymSlot.create({
        gymId,
        dayOfWeek,
        slots,
        isClosed
      });
    }

    res.json({
      success: true,
      gymSlot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

// Get all slots for a gym
export const getGymSlots = async (
  req: Request<{ gymId: string }>,
  res: Response<{ success: boolean; gymSlots?: any[]; error?: string }>
) => {
  try {
    const { gymId } = req.params;
    
    const gymSlots = await GymSlot.find({ gymId }).sort({ dayOfWeek: 1 });
    
    res.json({
      success: true,
      gymSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

// Update specific gym slot
export const updateGymSlot = async (
  req: Request<{ gymId: string; dayOfWeek: string }, {}, IUpdateGymSlot>,
  res: Response<{ success: boolean; gymSlot?: any; error?: string }>
) => {
  try {
    const { gymId, dayOfWeek } = req.params;
    const updateData = req.body;

    const gymSlot = await GymSlot.findOneAndUpdate(
      { gymId, dayOfWeek },
      updateData,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      gymSlot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

// Delete gym slot
export const deleteGymSlot = async (
  req: Request<{ gymId: string; dayOfWeek: string }>,
  res: Response<{ success: boolean; error?: string }>
) => {
  try {
    const { gymId, dayOfWeek } = req.params;
    
    await GymSlot.findOneAndDelete({ gymId, dayOfWeek });
    
    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
};

// Delete all slots for a gym (used in cascade deletion)
export const deleteAllGymSlots = async (gymId: string) => {
  try {
    await GymSlot.deleteMany({ gymId });
    return { success: true };
  } catch (error) {
    console.error("Error deleting all gym slots:", error);
    return { success: false, error: (error as Error).message };
  }
};
