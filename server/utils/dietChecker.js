exports.checkDietSuitability = (food, forbiddenList = []) => {
  // Combine all sources of data into one massive string for searching
  const combinedText = [
    (food.name || ''),                         // Fallback when ingredients are missing entirely
    (food.brand || ''),
    (food.ingredientsText || ''),              // The user-readable paragraph
    (food.ingredients || []).join(' '),        // System tags (en:milk)
    (food.allergens || []).join(' '),          // Explicit allergens (en:milk)
    (food.additives || []).join(' ')           // E-numbers
  ].join(' ').toLowerCase();

  console.log("Checking against text:", combinedText); // For debugging in your terminal

  let reasons = [];
  let isSuitable = true;

  forbiddenList.forEach(word => {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return;

    // Match singular/plural variants too (e.g. "peanut" should also catch
    // "peanuts" in ingredient lists, and vice versa).
    const variant = cleanWord.endsWith('s') ? cleanWord.slice(0, -1) : `${cleanWord}s`;

    if (combinedText.includes(cleanWord) || combinedText.includes(variant)) {
      isSuitable = false;
      // Format the reason nicely (Capitalize first letter)
      reasons.push(`Contains '${cleanWord}'`);
    }
  });
  
  return { 
    isSuitable, 
    reasons: reasons.length ? reasons : ['Safe based on your list'] 
  };
};