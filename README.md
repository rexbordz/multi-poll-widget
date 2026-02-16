Are you a multistreamer who’s always asking your viewers for their opinion about stuff? Sure, most platforms have their own poll system, but wouldn’t it be way better if you had **one global poll** that works across all the platforms you stream to?

Introducing **rexbordz’s MultiPoll Widget**.

It’s a clean browser-source widget that lets you run polls right on your stream, pulling votes straight from **Twitch**, **YouTube**, **Kick**, and **TikTok** chat. You can set up 2–5 choices, and your viewers just vote by typing the number of their choice (1, 2, 3, 4, or 5). Simple and universal.

Starting a poll is super easy. I built a very intuitive dock page where you can configure everything. This dock also shows a live data of the poll if there's an active one going on. Isn't that cool?!

<img width="809" height="313" alt="Multipoll sample image" src="https://github.com/user-attachments/assets/3f1e8417-f46d-46b4-af75-4a85c361ad02" />

---

## **🔌 Requirements**

<img src="https://github.com/user-attachments/assets/77ff6913-e6d7-4fe0-b9a0-bf66f5e8f745" style="height: 1em; vertical-align: middle;"> **Streamer.Bot (For Twitch, YouTube, and/or Kick)** <br>
If you need help setting this up, visit their [website](https://streamer.bot/).

<img src="https://github.com/user-attachments/assets/3ec8eac2-17d2-4a97-a066-e55c1e29d2c5" style="height: 1em; vertical-align: middle;"> **Tikfinity (For TikTok)** <br>
You need this to be able to listen to TikTok events. If you need help setting this up, you can check out my [Tikfinity Setup Guide](https://www.notion.so/Tikfinity-Setup-Guide-241088f4f93e8051b991c6ef4b659934?pvs=21).

---

## **🚀 Installation**

1. **Open Streamer.bot (For Twitch, YouTube or Kick)**
    - You need to have WebSocket Server enabled:
        
        <img width="998" height="693" alt="image" src="https://github.com/user-attachments/assets/e7635495-9b25-4276-8be1-154402a82298" />

        
2. **Open TikFinity (For TikTok)**
    - I believe TikFinity’s WebSocket Server is on by default so there’s nothing else that needs to be done except for having it opened with your TikTok account logged in.
3. Copy the link below and add **MultiPoll Widget** as a **Browser Source** to your streaming software of choice. 
    
    ```xml
    https://rexbordz.github.io/multi-poll-widget/
    ```
    <img width="1201" height="974" alt="image" src="https://github.com/user-attachments/assets/f58e8a21-b4a5-4106-80cd-a61b0e2b2406" />
  
  > [!NOTE]
  > <img src="https://github.com/user-attachments/assets/c427e0a9-05af-4fd3-b620-7e5158f81f8d" style="height: 1.5em; vertical-align: middle;"> **Patreon Supporter Exclusive** - **Paid** Patreon members can have access to the **PRO** version of this widget which enables you to add **up to 10 choices** to the poll. You can get the pro version link in my **[Discord server](https://discord.gg/pJWEPzbdfa)**. <br><br>
  > **[Click here to be a paid member](https://www.patreon.com/rexbordz)**
  
  > [!TIP]
  > Make sure to set the height so that there's enough space for the poll with 5 choices at most. The width is stretchable so you can set it to whatever.

4. Add the **MultiPoll Widget Settings Page** as a **Custom Browser Dock** to your streaming software of choice. 
    
    ```xml
    https://rexbordz.github.io/multi-poll-widget/dashboard
    ```
    <img width="1052" height="623" alt="image" src="https://github.com/user-attachments/assets/bac659a5-fe9e-4db1-ab3f-0e555ca8bf3d" />
    
  > [!NOTE]
  > <img src="https://github.com/user-attachments/assets/c427e0a9-05af-4fd3-b620-7e5158f81f8d" style="height: 1.5em; vertical-align: middle;"> **Patreon Supporter Exclusive** - **Paid** Patreon members can have access to the **PRO** version of this widget which enables you to add **up to 10 choices** to the poll. You can get the pro version link in my **[Discord server](https://discord.gg/pJWEPzbdfa)**. <br><br>
  > **[Click here to be a paid member](https://www.patreon.com/rexbordz)**
    
5. Start a poll using the settings page. First two choices are required. When you’re ready, just click **`Start Poll`**.
    <p align="center">
      <img width="469" height="625" alt="image" src="https://github.com/user-attachments/assets/a7b557b1-6204-43cd-8bc0-d402d4ccdfcf" />
    </p>
   <img width="809" height="313" alt="image" src="https://github.com/user-attachments/assets/a1b73a02-39c1-463a-8647-7b8e1ed60ced" />
    
  > [!TIP]
  > ✅ **SUCCESS!** You have successfully installed Multipoll.
        
---

## **➕ Optional Add-ons**

I added optional Streamer.Bot actions that add quality-of-life features that some may find very valuable: 

```xml
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
```

Just import the code above into your Streamer.bot.

<img width="567" height="339" alt="image" src="https://github.com/user-attachments/assets/c806d5cc-49ab-405c-bb69-0ef0ddaf9f20" />

1. **Button triggers** - the buttons that you find on the settings page have corresponding Streamer.bot actions that essentially do the same thing. Very helpful if you want to add a hotkey to the buttons or add them to your stream deck via the Streamer.bot plugin.
    - MultiPoll Widget • [Trigger] 1 - 15s Duration
    - MultiPoll Widget • [Trigger] 2 - 30s Duration
    - MultiPoll Widget • [Trigger] 3 - 1m Duration
    - MultiPoll Widget • [Trigger] 4 - 2m Duration
    - MultiPoll Widget • [Trigger] 5 - 10m Duration
    - MultiPoll Widget • [Trigger] 6 - Permanent
    - MultiPoll Widget • [Trigger] Clear
    - MultiPoll Widget • [Trigger] Start/End Poll
    - MultiPoll Widget • [Trigger] Toggle Poll
    - MultiPoll Widget • Poll Ended
    - MultiPoll Widget • Poll Started
    
    <img width="840" height="643" alt="image" src="https://github.com/user-attachments/assets/d0189318-10b1-4f9d-aed4-c464a0615151" />

    <img width="857" height="264" alt="image" src="https://github.com/user-attachments/assets/d3c98bd1-e01d-45c3-977d-ff310231503e" />
    
2. **Stream Deck Integration-** The actions are also compatible with Stream Deck. Just download the pre-made stream deck profiles I made [here](https://github.com/rexbordz/multi-poll-widget/tree/main/streamdeck), and import the correct variant to your Stream Deck Software.
    - **Stream Deck + (with action wheel support)**
        
        <img width="873" height="560" alt="image" src="https://github.com/user-attachments/assets/bd956bca-1300-4714-bf5b-7a92f9c7cf7d" />
        
    - **Stream Deck XL**
        
        <img width="880" height="549" alt="image" src="https://github.com/user-attachments/assets/3be8267b-142e-483c-bfc2-423ca19b872d" />
   
3. **MultiPoll Widget Bot Messages  -** When these are enabled, the widget automatically sends a bot message to all the platforms that it supports when a poll starts and ends. You can enable/disable the action or sub-actions inside it as you want.
    
    <img width="666" height="333" alt="image" src="https://github.com/user-attachments/assets/f43a662e-83b2-4699-a22a-449443498de6" />

> [!TIP]
> When you right click a **MultiPoll Widget • Poll Started** trigger and click **Requeue**, it will run that poll again with the same settings.

<img width="1186" height="767" alt="image" src="https://github.com/user-attachments/assets/ab9d53e0-b881-4147-969a-27dabad054b7" />

> [!TIP]
> You can also get the import code and the download link for the stream deck profiles through this button. It will also show you the status of all the Streamer.bot actions associated with the poll. A yellow dot at the bottom right suggests that you're missing at least one action

<p align="center">
<img width="643" height="601" alt="image" src="https://github.com/user-attachments/assets/c86e5a99-e98d-4544-a32a-e38c4abee242" />
    
<img width="485" height="573" alt="image" src="https://github.com/user-attachments/assets/8e4a0c58-0abc-4beb-b36e-fd5e8eedb54a" />
</p>>

---

## 🎨 Customizing the Overlay

Copy and paste this to the source’s **custom CSS** and adjust the values. I made the variable names self-explanatory so I don’t need to explain what they all change:

```xml
:root {
  --card-bg: rgba(23, 23, 23, 0.98);
  --card-radius: 24px;
  --card-pad: 25px;
  --card-shadow: 0 4px 10px rgba(0,0,0,0.4);

	--font: 'InterVariable', 'Inter', sans-serif;
  --font-size: 18px;
  --text-color: #fff;
  
  --color-choice-1: #3b82f6;
  --color-choice-2: #ef4444;
  --color-choice-3: #22c55e;
  --color-choice-4: #eab308;
  --color-choice-5: #f97316;
}
```

<img width="893" height="1013" alt="image" src="https://github.com/user-attachments/assets/12a8cfd6-99e3-4269-bcc9-c8c8f92f1d34" />

---

## 💝 Donate

Your donations help me create better content and improve stream quality! If you'd like to support my work and see more of it, you can donate through any of the following:

---

## 📞 Support

For technical support or inquiries, please contact me through my Discord channel:

- <img src="https://github.com/user-attachments/assets/99e66009-11f1-4bcc-a06f-aa5c2f90524a" style="height: 1.5em;"> **[Discord Server](https://discord.gg/pJWEPzbdfa)**

    You can ask questions in the [🗨️❓│support forum](https://discord.com/channels/789352409473875988/1327979423835623464) or  [#❓│support channel](https://discord.com/channels/789352409473875988/800788710789742622)
    
- 🐞 **Bug Reports**
    
    Post any bug reports in the [#🐞│bug-reports channel](https://discord.com/channels/789352409473875988/1317386476501205044) in my discord page
