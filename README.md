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

<img width="565" height="152" alt="image" src="https://github.com/user-attachments/assets/75843d78-ae30-47d8-b56d-02cb37533357" />

1. **Button triggers** - the buttons that you find on the settings page have corresponding Streamer.bot actions that essentially do the same thing. Very helpful if you want to add a hotkey to the buttons or add them to your stream deck via the Streamer.bot plugin.
    - MultiPoll Widget • [Trigger] Clear
    - MultiPoll Widget • [Trigger] Start/End Poll
    - MultiPoll Widget • [Trigger] Toggle Poll
    
    <img width="840" height="643" alt="image" src="https://github.com/user-attachments/assets/b5b8fb03-a30f-4e3a-8142-8195009b687c" />

    <img width="857" height="264" alt="image" src="https://github.com/user-attachments/assets/801cb649-aad9-49f4-a05f-aeb796c719ef" />
    
    <img width="908" height="772" alt="image" src="https://github.com/user-attachments/assets/128a40dc-71f1-4249-9eca-a7a08870f3b1" />

    
2. **MultiPoll Widget • Bot Messages  -** When this is enabled, the widget automatically sends a bot message to all the platforms that it supports when a poll starts and ends. You can enable/disable the action or sub-actions inside it as you want.
    
    <img width="1190" height="640" alt="image" src="https://github.com/user-attachments/assets/df67149b-ac68-4115-87a6-e5d7eb88a0cb" />

---

## **⚙️ Custom Settings**

You can kind of customize the widget by adding these parameters at the end of the URL:

**Custom Streamer.bot Address:**

```xml
?address=[Insert custom address here]
```

**Custom Streamer.bot Port:**

```xml
?port=[Insert custom port here]
```

So with custom settings, your browser source link should look like this:

`widget-link.com?alignRight=false?address=127.0.0.2?port=8081`

### 🎨 Customizing the Overlay

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
<p align="center">
    <img width="893" height="1013" alt="image" src="https://github.com/user-attachments/assets/30d82eaa-c07e-4f52-809f-38384ced13c5" />
</p>
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
